import os
import logging
from fastapi.responses import Response
from elevenlabs.client import ElevenLabs
from dotenv import load_dotenv

# Configure logging
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

# Initialize ElevenLabs API key
ELEVENLABS_API_KEY = os.getenv("ELEVENLABS_API_KEY")

# Default voice ID - using a professional, caring doctor voice
# You can change this to any ElevenLabs voice ID
DEFAULT_VOICE_ID = "21m00Tcm4TlvDq8ikWAM"  # Rachel - professional female voice
# Alternative: "pNInz6obpgDQGcFmaJgB" (Adam - professional male voice)

def text_to_speech(text: str, voice_id: str = None) -> bytes:
    """
    Convert text to speech using ElevenLabs TTS
    
    Args:
        text: The text to convert to speech
        voice_id: ElevenLabs voice ID (default: professional female voice)
        
    Returns:
        bytes: Audio data in MP3 format
        
    Raises:
        ValueError: If API key is not set or text is invalid
        Exception: If TTS generation fails
    """
    # Validate inputs
    if not ELEVENLABS_API_KEY:
        raise ValueError("ELEVENLABS_API_KEY is not set in environment variables")
    
    if not text or not text.strip():
        raise ValueError("Text cannot be empty")
    
    # Use default voice if not provided
    if not voice_id:
        voice_id = DEFAULT_VOICE_ID
    
    logger.info(f"Starting TTS generation - text length: {len(text)}, voice_id: {voice_id}")
    
    try:
        # Initialize ElevenLabs client
        logger.debug("Initializing ElevenLabs client")
        client = ElevenLabs(api_key=ELEVENLABS_API_KEY)
        
        # Generate audio from text
        # Using eleven_turbo_v2 for faster generation (lower latency)
        # Alternative: "eleven_flash_v2" for even faster but lower quality
        # "eleven_multilingual_v2" for best quality but slower
        logger.debug(f"Calling ElevenLabs API with model: eleven_turbo_v2")
        audio = client.text_to_speech.convert(
            voice_id=voice_id,
            text=text,
            model_id="eleven_turbo_v2"  # Faster model for lower latency
        )
        
        # Read audio bytes
        logger.debug("Reading audio chunks")
        audio_bytes = b""
        chunk_count = 0
        for chunk in audio:
            audio_bytes += chunk
            chunk_count += 1
        
        logger.info(f"TTS generation successful - audio size: {len(audio_bytes)} bytes, chunks: {chunk_count}")
        return audio_bytes
        
    except ValueError as e:
        logger.error(f"TTS ValueError: {str(e)}")
        raise
    except Exception as e:
        error_msg = f"Failed to generate speech: {str(e)}"
        logger.error(f"TTS Exception: {error_msg}")
        logger.error(f"Exception type: {type(e).__name__}")
        raise Exception(error_msg) from e


def handle_tts_request(text: str, voice_id: str | None = None) -> Response:
    """
    Generate speech from text and return a FastAPI Response (audio/mpeg).
    Use this from the API route so main has no ElevenLabs-specific logic.
    """
    audio_bytes = text_to_speech(text, voice_id)
    return Response(content=audio_bytes, media_type="audio/mpeg")
