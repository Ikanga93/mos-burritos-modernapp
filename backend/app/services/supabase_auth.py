"""
Mo's Burritos - Supabase Authentication Service
Phone OTP authentication using Supabase Auth
"""
from typing import Optional, Dict, Any
import httpx
from supabase import create_client, Client

from ..config import settings


def get_supabase_client() -> Client:
    """Get Supabase client instance"""
    if not settings.supabase_url or not settings.supabase_anon_key:
        raise ValueError("Supabase URL and anon key must be configured")
    return create_client(settings.supabase_url, settings.supabase_anon_key)


def get_supabase_admin_client() -> Client:
    """Get Supabase admin client with service role key"""
    if not settings.supabase_url or not settings.supabase_service_key:
        raise ValueError("Supabase URL and service key must be configured")
    return create_client(settings.supabase_url, settings.supabase_service_key)


async def send_phone_otp(phone: str) -> Dict[str, Any]:
    """
    Send OTP code to phone number via Supabase Auth
    Phone should be in E.164 format (e.g., +15551234567)
    """
    supabase = get_supabase_client()
    
    try:
        response = supabase.auth.sign_in_with_otp({
            "phone": phone
        })
        return {"success": True, "message": "OTP sent successfully"}
    except Exception as e:
        return {"success": False, "error": str(e)}


async def verify_phone_otp(phone: str, code: str) -> Dict[str, Any]:
    """
    Verify OTP code and get session
    Returns session data with access_token and user info
    """
    supabase = get_supabase_client()
    
    try:
        response = supabase.auth.verify_otp({
            "phone": phone,
            "token": code,
            "type": "sms"
        })
        
        if response.session:
            return {
                "success": True,
                "session": {
                    "access_token": response.session.access_token,
                    "refresh_token": response.session.refresh_token,
                    "expires_at": response.session.expires_at,
                },
                "user": {
                    "id": response.user.id,
                    "phone": response.user.phone,
                    "created_at": str(response.user.created_at) if response.user.created_at else None,
                }
            }
        else:
            return {"success": False, "error": "Invalid OTP code"}
            
    except Exception as e:
        return {"success": False, "error": str(e)}


async def get_supabase_user_from_token(access_token: str) -> Optional[Dict[str, Any]]:
    """
    Validate Supabase JWT and get user info
    Used by auth middleware to validate incoming requests
    """
    supabase = get_supabase_client()
    
    try:
        response = supabase.auth.get_user(access_token)
        
        if response.user:
            return {
                "id": response.user.id,
                "phone": response.user.phone,
                "email": response.user.email,
                "created_at": str(response.user.created_at) if response.user.created_at else None,
            }
        return None
        
    except Exception as e:
        return None


async def refresh_supabase_session(refresh_token: str) -> Dict[str, Any]:
    """Refresh Supabase session using refresh token"""
    supabase = get_supabase_client()
    
    try:
        response = supabase.auth.refresh_session(refresh_token)
        
        if response.session:
            return {
                "success": True,
                "session": {
                    "access_token": response.session.access_token,
                    "refresh_token": response.session.refresh_token,
                    "expires_at": response.session.expires_at,
                },
                "user": {
                    "id": response.user.id,
                    "phone": response.user.phone,
                }
            }
        return {"success": False, "error": "Failed to refresh session"}
        
    except Exception as e:
        return {"success": False, "error": str(e)}
