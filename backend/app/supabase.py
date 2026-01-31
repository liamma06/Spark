
import os
from supabase import create_client, Client
from dotenv import load_dotenv
from fastapi.responses import JSONResponse

# Load environment variables
load_dotenv()

# Initialize Supabase client
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    raise ValueError("Please set SUPABASE_URL and SUPABASE_KEY in your .env file")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)


def sign_up(email: str, password: str, full_name: str, role: str) -> dict:
    """
    Sign up a new user with email and password
    
    Args:
        email: User's email address
        password: User's password
        name: User's name 
        role: User's role(patient,doctor)
        
    Returns:
        dict: Authentication response with user data and session
    """
    try:
        response = supabase.auth.sign_up({
            "email": email,
            "password": password,
            "options":{
                "data":{
                    "full_name": full_name,
                    "role": role
                }
            }
        })
        
        if response.user:
            print(f"Sign up successful! User ID: {response.user.id}")
            print(f"Email: {response.user.email}")
            print(f"Name: {response.user.user_metadata.get('full_name')}")
            print(f"Role: {response.user.user_metadata.get('role')}")
            # Check if email confirmation is required
            if not response.session:
                print("Please check your email to confirm your account")
            
            return {
                "success": True,
                "user": response.user,
                "session": response.session
            }
        else:
            return {
                "success": False,
                "error": "Sign up failed"
            }
            
    except Exception as e:
        print(f"Sign up error: {str(e)}")
        return {
            "success": False,
            "error": str(e)
        }


def sign_in(email: str, password: str) -> dict:
    """
    Sign in an existing user with email and password
    
    Args:
        email: User's email address
        password: User's password
        
    Returns:
        dict: Authentication response with user data and session
    """
    response = supabase.auth.sign_in_with_password({
        "email": email,
        "password": password
    })
    
    if response.user and response.session:
        print(f"✅ Sign in successful! Welcome back!")
        print(f"User ID: {response.user.id}")
        print(f"Email: {response.user.email}")
        print(f"Name: {response.user.user_metadata.get('full_name')}")
        print(f"Role: {response.user.user_metadata.get('role')}")
        print(f"Access Token: {response.session.access_token[:20]}...")
        
        
        return response.user.id
    else:
        raise Exception()
        


def sign_out() -> dict:
    """
    Sign out the current user
    
    Returns:
        dict: Sign out response
    """
    try:
        supabase.auth.sign_out()
        return JSONResponse(
            status_code=200,
            content={
                "msg": "Successfully ignored"
            }
        )
    except Exception as e:
        return JSONResponse(
            status_code=400,
            content={
                "msg": f"Error while logging out: {e}"
            }
        )


def get_current_user() -> dict:
    """
    Get the current authenticated user
    
    Returns:
        dict: Current user data
    """
    try:
        user = supabase.auth.get_user()
        
        if user:
            print(f"Current user: {user.user.email}")
            return {
                "success": True,
                "user": user.user
            }
        else:
            print("No user currently signed in")
            return JSONResponse(
                content={
                    "msg": "No user currently "
                },
                status_code=400
            )
            
    except Exception as e:
        print(f"❌ Error getting user: {str(e)}")
        return {
            "success": False,
            "error": str(e)
        }


def reset_password(email: str) -> dict:
    """
    Send password reset email
    
    Args:
        email: User's email address
        
    Returns:
        dict: Password reset response
    """
    try:
        supabase.auth.reset_password_email(email)
        print(f"✅ Password reset email sent to {email}")
        return {"success": True}
        
    except Exception as e:
        print(f"❌ Password reset error: {str(e)}")
        return {
            "success": False,
            "error": str(e)
        }


def main():
    """
    Interactive demo of authentication features
    """
    print("\n=== Supabase Authentication Demo ===\n")
    
    while True:
        print("\nOptions:")
        print("1. Sign Up")
        print("2. Sign In")
        print("3. Sign Out")
        print("4. Get Current User")
        print("5. Reset Password")
        print("6. Exit")
        
        choice = input("\nEnter your choice (1-6): ").strip()
        
        if choice == "1":
            email = input("Enter email: ").strip()
            password = input("Enter password: ").strip()
            sign_up(email, password)
            
        elif choice == "2":
            email = input("Enter email: ").strip()
            password = input("Enter password: ").strip()
            sign_in(email, password)
            
        elif choice == "3":
            sign_out()
            
        elif choice == "4":
            get_current_user()
            
        elif choice == "5":
            email = input("Enter email: ").strip()
            reset_password(email)
            
        elif choice == "6":
            print("\nGoodbye!")
            break
            
        else:
            print("Invalid choice. Please try again.")


if __name__ == "__main__":
    main()

