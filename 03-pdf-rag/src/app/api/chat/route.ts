// ✅ MODIFIED API ROUTE WITH CHAT HISTORY + RAG + PROVEN TRIM STRATEGY
import { getVectorStore } from "@/lib/vectorDB";
import { ChatOpenAI } from "@langchain/openai";
import { HumanMessage, SystemMessage, trimMessages } from "@langchain/core/messages";

// Temporary in-memory session store (for dev only!)
const sessionMemory = new Map();

export async function POST(request: Request) {
    const { sessionId, filter, query } = await request.json();
    if (!sessionId || !query) return new Response("Missing sessionId or query", { status: 400 });

    const vectorStore = await getVectorStore();
    const retriever = await vectorStore.asRetriever({
        k: 2,
        filter: filter || {},
    });

    const similarDocs = await retriever.invoke(query);
    console.log(`Context for query "${query}":`, similarDocs.map(doc => doc.pageContent).join("\n---\n"));
    
    const contextText = similarDocs.map(doc => doc.pageContent).join("\n---\n");

    // Load previous messages
    const history = sessionMemory.get(sessionId) || [];

    // If no previous history, prepend a detailed system prompt for better RAG output
    const baseMessages = history.length === 0
        ? [
            new SystemMessage("You are a helpful and concise assistant. Use the provided context to answer user questions as accurately as possible. " +
            "If the answer is not contained in the context, say 'I'm not sure based on the information provided.' Do not hallucinate. " +
            "You can optionally ask the user if they would like an answer based on your general knowledge instead."
            )
        ]
        : [];

    // Add new user message with context clearly separated
    const newMessage = new HumanMessage(
        `User Question: ${query}\n\nRelevant Context:\n${contextText}`
    );

    const messages = [...baseMessages, ...history, newMessage];

    // Trim using proven strategy
    const trimmed = await trimMessages(messages, {
        maxTokens: 2048,
        strategy: "last",
        tokenCounter: new ChatOpenAI({ modelName: "gpt-4.1-nano" }),
        includeSystem: true,
    });

    const model = new ChatOpenAI({ model: "gpt-4.1-nano" });
    const response = await model.invoke(trimmed);

    // Update and store session history
    const updatedHistory = [...history, new HumanMessage(query), response];
    sessionMemory.set(sessionId, updatedHistory);

    return new Response(JSON.stringify({ response: response.content }), {
        headers: { "Content-Type": "application/json" },
    });
}
