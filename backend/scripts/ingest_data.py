# backend/scripts/ingest_data.py
import os
from dotenv import load_dotenv
from langchain_openai import AzureOpenAIEmbeddings
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_community.vectorstores.azure_search import AzureSearch

def main():
    """
    This script loads the knowledge base, splits it into chunks,
    creates embeddings, and indexes them in Azure AI Search.
    """
    # 1. Load Environment Variables
    load_dotenv(dotenv_path='../.env')

    AZURE_OPENAI_API_KEY = os.getenv("AZURE_OPENAI_API_KEY")
    AZURE_OPENAI_ENDPOINT = os.getenv("AZURE_OPENAI_ENDPOINT")
    AZURE_OPENAI_API_VERSION = os.getenv("AZURE_OPENAI_API_VERSION")
    AZURE_OPENAI_EMBEDDING_DEPLOYMENT = os.getenv("AZURE_OPENAI_EMBEDDING_DEPLOYMENT", "text-embedding-ada-002") # Assuming a default, can be set in .env
    
    AZURE_SEARCH_ENDPOINT = os.getenv("AZURE_COGNITIVE_SEARCH_ENDPOINT")
    AZURE_SEARCH_KEY = os.getenv("AZURE_COGNITIVE_SEARCH_KEY")
    AZURE_SEARCH_INDEX_NAME = os.getenv("AZURE_COGNITIVE_SEARCH_INDEX_NAME")

    print("Loaded environment variables.")
    # Basic validation
    if not all([AZURE_OPENAI_API_KEY, AZURE_OPENAI_ENDPOINT, AZURE_SEARCH_ENDPOINT, AZURE_SEARCH_KEY, AZURE_SEARCH_INDEX_NAME]):
        print("Error: One or more critical environment variables are missing.")
        print("Please ensure your .env file is correctly set up.")
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
    embeddings = AzureOpenAIEmbeddings(
        azure_deployment=AZURE_OPENAI_EMBEDDING_DEPLOYMENT,
        api_key=AZURE_OPENAI_API_KEY,
        azure_endpoint=AZURE_OPENAI_ENDPOINT,
        api_version=AZURE_OPENAI_API_VERSION,
    )
    print("Azure OpenAI Embeddings model initialized.")

    # 4. Create and Populate Azure AI Search Index
    print(f"Creating/updating index '{AZURE_SEARCH_INDEX_NAME}' in '{AZURE_SEARCH_ENDPOINT}'...")
    
    try:
        vector_store = AzureSearch(
            azure_search_endpoint=AZURE_SEARCH_ENDPOINT,
            azure_search_key=AZURE_SEARCH_KEY,
            index_name=AZURE_SEARCH_INDEX_NAME,
            embedding_function=embeddings.embed_query,
        )
        vector_store.add_documents(documents=documents)
        print("Successfully indexed documents to Azure AI Search.")
        print("\n--- Ingestion Complete ---")
        print("You can now run the main application to perform RAG queries.")

    except Exception as e:
        print("\n--- An Error Occurred ---")
        print(f"Failed to index documents. Error: {e}")
        print("Please check the following:")
        print("1. Your Azure credentials in the .env file are correct.")
        print("2. The Private Endpoint (PEP) is correctly configured in your environment.")
        print("3. The required packages (`langchain`, `azure-search-documents`, etc.) are installed.")

if __name__ == "__main__":
    main()
