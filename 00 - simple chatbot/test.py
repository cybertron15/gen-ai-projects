import os
from dotenv import load_dotenv

load_dotenv()
# Fetch GEMINI_API_KEY from environment variables
key = os.getenv('KEY')

# Print the API key
print(key)