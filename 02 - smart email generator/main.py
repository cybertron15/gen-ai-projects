from google import genai
from google.genai import types # type: ignore
import os
from dotenv import load_dotenv # type: ignore

load_dotenv()
client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))
model = os.getenv("GEMINI_MODEL")

def main():
    print("Hello from 02-smart-email-generator!")


if __name__ == "__main__":
    main()
