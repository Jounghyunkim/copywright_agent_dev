# backend/scripts/ingest_data.py
import os
import argparse
from dotenv import load_dotenv
from langchain_openai import AzureOpenAIEmbeddings
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import FAISS

def main():
    """
    This script loads the knowledge base, splits it into chunks,
    creates embeddings using Azure OpenAI, and saves them to a local FAISS index.
    """
    parser = argparse.ArgumentParser(description="Ingest data into a local FAISS index.")
    parser.add_argument("--index-path", type=str, default="../data/faiss_index", help="Path to save the FAISS index.")
    args = parser.parse_args()

    # 1. Load Environment Variables
    load_dotenv(dotenv_path='../.env')

    AZURE_OPENAI_API_KEY = os.getenv("AZURE_OPENAI_API_KEY")
    EMBEDDING_ENDPOINT = os.getenv("EMBEDDING_ENDPOINT")
    AZURE_OPENAI_API_VERSION = os.getenv("AZURE_OPENAI_API_VERSION")
    EMBEDDING_DEPLOYMENT = os.getenv("EMBEDDING_DEPLOYMENT")
    
    print("Loaded environment variables.")
    if not all([AZURE_OPENAI_API_KEY, EMBEDDING_ENDPOINT, EMBEDDING_DEPLOYMENT]):
        print("Error: Azure OpenAI credentials for embedding are missing in the .env file.")
        return

    # 2. Load and Split the Knowledge Base
    try:
        with open("../data/knowledge_base.txt", "r", encoding="utf-8") as f:
            knowledge_base_text = f.read()
        print("Knowledge base file loaded.")
    except FileNotFoundError:
        print("Error: knowledge_base.txt not found in the ../data/ directory.")
        return

    text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
    documents = text_splitter.create_documents([knowledge_base_text])
    print(f"Split knowledge base into {len(documents)} document chunks.")

    # 3. Initialize Embeddings Model
    try:
        embeddings = AzureOpenAIEmbeddings(
            azure_deployment=EMBEDDING_DEPLOYMENT,
            api_key=AZURE_OPENAI_API_KEY,
            azure_endpoint=EMBEDDING_ENDPOINT,
            api_version=AZURE_OPENAI_API_VERSION,
        )
        print("Azure OpenAI Embeddings model initialized.")
    except Exception as e:
        print(f"Error initializing embeddings model: {e}")
        return

    # 4. Create FAISS index from documents and save locally
    print(f"Creating FAISS index from {len(documents)} documents...")
    try:
        vector_store = FAISS.from_documents(documents, embeddings)
        vector_store.save_local(args.index_path)
        print(f"Successfully created and saved FAISS index to '{args.index_path}'")
        print("\n--- Ingestion Complete ---")
        print("You can now run the main application to perform RAG queries from the local index.")
    except Exception as e:
        print(f"\n--- An Error Occurred During Indexing ---")
        print(f"Failed to create FAISS index. Error: {e}")
        print("Please check your Azure OpenAI credentials and network (PEP) connection.")

if __name__ == "__main__":
    main()
