from google import genai
from google.genai import types
import os
from dotenv import load_dotenv

load_dotenv()
client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

model = "gemini-2.5-pro-exp-03-25"


def generate_gemini_response(prompt, stream=True):
    if stream:
        response = client.models.generate_content_stream(
            model="gemini-2.0-flash", contents=[prompt]
        )
        print("Gemini: ", end="")
        for chunk in response:
            print(chunk.text, end="")
    else:
        # If not streaming, we can use the non-streaming method=
        response = client.models.generate_content(model=model, contents=prompt)
        return response.text


def gemini_chat(system_prompt, stream=True):
    chat = client.chats.create(
        model=model,
        config=types.GenerateContentConfig(
            system_instruction=system_prompt, maxOutputTokens=1000
        ),
    )
    print(f"Hello!. How can I assist you today?")

    while True:
        user_input = input("You: ")
        if user_input.lower() == "exit":
            print("Exiting the chat. Goodbye!")
            break
    
        if stream:
            response = chat.send_message_stream(user_input)
            print("Gemini: ", end="")
            for chunk in response:
                print(chunk.text, end="")
        else:
            response = chat.send_message(user_input)
            print("Gemini: ", response.text)
        print("\n")

def main():
    print("Welcome! Which expert you want to talk to?")
    user_input = input("you: ")

    DYNAMIC_EXPERT_PROMPT = """
            You are a prompt generation assistant.

            Your job is to create a JSON object containing a structured system prompt for an AI assistant, based on a user's            request for an expert in any domain.

            Instructions:

            1. Read the user input carefully.
            2. Extract the field or domain of expertise (e.g., martial arts, nutrition, cloud computing).
            3. Write a detailed system prompt that:
               - Assigns the AI the role of a highly experienced expert in that domain.
               - Includes clear guidelines around ethics, safety, clarity, and boundaries.
               - Emphasizes actionable, real-world advice.
               - Uses a professional, encouraging, and concise tone.

            Output format:

            {
              "system_prompt": "<your generated prompt here>",
              "expert": "<extracted expert role from the input> expert"
            }

            "DON'T GIVE OUTPUT ENCLOSED IN ````json```".

            Example input:
            "I need an expert in martial arts"

            Now generate the JSON for the following input:
            """
    response = generate_gemini_response(DYNAMIC_EXPERT_PROMPT + user_input, stream=False)
    gemini_chat(response, stream=True)

if __name__ == "__main__":
    main()
