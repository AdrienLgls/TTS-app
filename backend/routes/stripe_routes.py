import os
import stripe
from fastapi import APIRouter, HTTPException, status, Depends, Request
from fastapi.responses import RedirectResponse
from dotenv import load_dotenv
from auth.security import verify_current_user
from database import get_users_collection
from bson import ObjectId

load_dotenv()

router = APIRouter(prefix="/stripe", tags=["stripe"])

# Configuration Stripe
stripe.api_key = os.getenv("STRIPE_SECRET_KEY")
STRIPE_PRICE_ID = os.getenv("STRIPE_PRICE_ID")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5174")

@router.post("/create-checkout-session")
async def create_checkout_session(
    request: Request,
    current_user: dict = Depends(verify_current_user)
):
    """
    Créer une session Stripe Checkout pour l'achat Premium
    """
    try:
        # Créer une session Stripe Checkout
        checkout_session = stripe.checkout.Session.create(
            payment_method_types=['card'],
            line_items=[
                {
                    'price': STRIPE_PRICE_ID,
                    'quantity': 1,
                },
            ],
            mode='subscription',  # Mode abonnement (car le prix Stripe est récurrent)
            success_url=f"{FRONTEND_URL}/success?session_id={{CHECKOUT_SESSION_ID}}",
            cancel_url=f"{FRONTEND_URL}/cancel",
            client_reference_id=current_user["user_id"],  # Pour identifier l'utilisateur
            metadata={
                'user_id': current_user["user_id"],
                'email': current_user["email"]
            }
        )

        return {
            "success": True,
            "checkout_url": checkout_session.url,
            "session_id": checkout_session.id
        }

    except Exception as e:
        print(f"Erreur lors de la création de la session Stripe: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur lors de la création de la session de paiement: {str(e)}"
        )

@router.post("/webhook")
async def stripe_webhook(request: Request):
    """
    Webhook pour recevoir les événements Stripe
    """
    payload = await request.body()
    sig_header = request.headers.get('stripe-signature')
    webhook_secret = os.getenv("STRIPE_WEBHOOK_SECRET")

    try:
        if webhook_secret:
            # Vérifier la signature du webhook
            event = stripe.Webhook.construct_event(
                payload, sig_header, webhook_secret
            )
        else:
            # En développement, sans signature
            import json
            event = json.loads(payload)

        # Gérer l'événement de paiement réussi
        if event['type'] == 'checkout.session.completed':
            session = event['data']['object']

            # Récupérer l'ID utilisateur
            user_id = session.get('client_reference_id') or session['metadata'].get('user_id')

            if user_id:
                # Mettre à jour l'utilisateur en Premium
                users_collection = get_users_collection()
                await users_collection.update_one(
                    {"_id": ObjectId(user_id)},
                    {
                        "$set": {
                            "is_premium": True,
                            "premium_since": stripe.util.convert_to_stripe_object(session)['created']
                        }
                    }
                )

                print(f"✅ Utilisateur {user_id} mis à jour en Premium")

        return {"success": True}

    except Exception as e:
        print(f"❌ Erreur webhook Stripe: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.post("/activate-premium-test")
async def activate_premium_test(
    request: Request,
    current_user: dict = Depends(verify_current_user)
):
    """
    ENDPOINT DE TEST - Activer Premium manuellement (à retirer en production)
    """
    try:
        user_id = current_user["user_id"]
        users_collection = get_users_collection()
        from datetime import datetime

        await users_collection.update_one(
            {"_id": ObjectId(user_id)},
            {
                "$set": {
                    "is_premium": True,
                    "premium_since": datetime.utcnow()
                }
            }
        )

        print(f"✅ TEST - Utilisateur {user_id} mis en Premium")

        return {
            "success": True,
            "message": "Premium activé avec succès (mode test)"
        }

    except Exception as e:
        print(f"Erreur lors de l'activation Premium test: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.get("/verify-payment/{session_id}")
async def verify_payment(
    session_id: str,
    current_user: dict = Depends(verify_current_user)
):
    """
    Vérifier le statut d'un paiement et activer Premium si nécessaire
    """
    try:
        session = stripe.checkout.Session.retrieve(session_id)

        # Si le paiement est complété, activer Premium
        if session.payment_status == 'paid':
            user_id = current_user["user_id"]
            users_collection = get_users_collection()

            # Vérifier si l'utilisateur n'est pas déjà Premium
            user_doc = await users_collection.find_one({"_id": ObjectId(user_id)})
            if user_doc and not user_doc.get("is_premium", False):
                # Mettre à jour en Premium
                from datetime import datetime
                await users_collection.update_one(
                    {"_id": ObjectId(user_id)},
                    {
                        "$set": {
                            "is_premium": True,
                            "premium_since": datetime.utcnow()
                        }
                    }
                )
                print(f"✅ Utilisateur {user_id} mis à jour en Premium via verify-payment")

        return {
            "success": True,
            "payment_status": session.payment_status,
            "customer_email": session.customer_details.email if session.customer_details else None
        }

    except Exception as e:
        print(f"Erreur lors de la vérification du paiement: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erreur lors de la vérification du paiement"
        )