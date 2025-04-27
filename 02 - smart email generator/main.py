from google import genai
from google.genai import types  # type: ignore
import os
from dotenv import load_dotenv  # type: ignore

load_dotenv()
client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))
model = os.getenv("GEMENI_MODEL")


def gemini_chat(system_prompt, stream=True):
    chat = client.chats.create(
        model=model,
        config=types.GenerateContentConfig(
            system_instruction=system_prompt, maxOutputTokens=1000
        ),
    )
    
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
    user_input = input(
        "Please choose a style for your email. \n1. Professional/Corporate Style \n2.  Casual/Friendly Style \n3. Persuasive/Marketing Style\n Enter your choice (1/2/3): "
    )

    assert user_input is not None, "User input cannot be None"
    try:
        int(user_input)
    except ValueError:
        raise ValueError("User input must be an integer")

    user_input = int(user_input)

    email_styles = {
        1: {
            "chain_of_thought": (
                "Maintain a formal and respectful tone. ",
                "Start with a polite greeting, clearly state the purpose early ",
                "use structured paragraphs, and close with a formal sign-off. ",
                "Avoid casual phrases, use professional language, and ensure clarity and brevity. ",
                "Always focus on clear next steps or a clear ask.",
            ),
            "examples": [
                "Subject: Request for Meeting Regarding Partnership Opportunities\n\nDear Mr. Sharma,\n\nI hope this email finds you well. I am writing to explore potential collaboration opportunities between our organizations. Please let me know your availability for a meeting.\n\nSincerely,\nJohn Doe",
                "Subject: Submission of Quarterly Report\n\nDear Ms. Kapoor,\n\nAttached is the quarterly performance report for Q2 2025. Please review it at your earliest convenience and let me know if there are any questions.\n\nBest regards,\nPriya Mehta",
            ],
        },
        2: {
            "chain_of_thought": (
                "Use a warm, approachable tone. ",
                "Start with a casual greeting, be conversational but still respectful. ",
                "Keep sentences shorter, sprinkle in friendly phrases, and sound like you're writing to a colleague or a friend. ",
                "The goal is to build connection, not just deliver information.",
            ),
            "examples": [
                "Subject: Quick Catch-Up?\n\nHey Alex,\n\nHope you're doing great! Just wanted to check if you're free sometime this week for a quick catch-up. No pressure — would love to hear what you've been up to!\n\nCheers,\nSam",
                "Subject: Got a Sec to Chat?\n\nHi Maya,\n\nWanted to run an idea by you when you have a minute. It’s nothing urgent, but think you’ll find it exciting!\n\nTalk soon,\nRyan",
            ],
        },
        3: {
            "chain_of_thought": (
                "Create excitement and urgency. ",
                "Open with an attention-grabbing hook, quickly highlight a pain point or a benefit ",
                "use persuasive language and strong emotional triggers. ",
                "End with a clear, enthusiastic call to action. ",
                "Keep energy high throughout the email.",
            ),
            "examples": [
                "Subject: Unlock Your Potential Today\n\nHey Superstar,\n\nTired of feeling stuck? Our new masterclass is designed to help you smash your goals — and it’s absolutely free (for now). Sign up before seats run out!\n\nLet’s go,\nThe Growth Team",
                "Subject: Last Chance to Grab 50% Off!\n\nHi there,\n\nOur biggest sale of the year is about to end. Don’t miss out on upgrading your [product/service] experience for half the price. Act now — the clock’s ticking!\n\nSee you inside,\nTeam Spark",
            ],
        },
    }
    

    print("Please provide a brief description of the email you want to generate.")
    
    system_prompt = f"You are a highly skilled professional email writer. \n\nYour responsibilities:\n- Understand the user’s intent and the context of the email.\n- Write emails that are clear, engaging, and suited to the requested style.\n\nGuidelines\n{email_styles[user_input]['chain_of_thought']}\nExamples for reference:\n{email_styles[user_input]['examples']}\n\nInstructions:\n- Keep the email concise and purposeful.\n- Maintain a tone matching the selected style (professional, casual, or persuasive).\n- If unsure, prioritize clarity and user value.\n- Always include a clear next step or call to action, if appropriate."

    gemini_chat(
        system_prompt=system_prompt,
        stream=True,
    )

if __name__ == "__main__":
    main()
