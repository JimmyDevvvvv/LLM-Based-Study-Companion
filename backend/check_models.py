"""
Script to check available Gemini models for your API key
Run this in your backend directory: python check_models.py
"""

import google.generativeai as genai
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure API
api_key = os.getenv('GEMINI_API_KEY')
if not api_key:
    print("❌ GEMINI_API_KEY not found in environment")
    exit(1)

genai.configure(api_key=api_key)

print("🔍 Checking available Gemini models...\n")
print("=" * 70)

# List all models
all_models = list(genai.list_models())
print(f"📊 Total models found: {len(all_models)}\n")

# Filter models that support generateContent
generate_models = []
for model in all_models:
    if 'generateContent' in model.supported_generation_methods:
        generate_models.append(model)

print(f"✅ Models supporting generateContent: {len(generate_models)}\n")
print("=" * 70)

if generate_models:
    print("\n🎯 AVAILABLE MODELS FOR TEXT GENERATION:\n")
    for i, model in enumerate(generate_models, 1):
        print(f"{i}. {model.name}")
        print(f"   Display Name: {model.display_name}")
        print(f"   Description: {model.description[:80]}..." if len(model.description) > 80 else f"   Description: {model.description}")
        print(f"   Supported Methods: {', '.join(model.supported_generation_methods)}")
        print()
    
    print("=" * 70)
    print("\n💡 RECOMMENDED MODEL NAMES TO USE:\n")
    
    # Extract just the model name (without 'models/' prefix)
    for model in generate_models:
        model_name = model.name.split('/')[-1]
        print(f"   '{model_name}'")
    
    print("\n" + "=" * 70)
    print("\n📝 USAGE EXAMPLE:\n")
    print("In your orchestrator.py, use:")
    print(f"model = genai.GenerativeModel('{generate_models[0].name.split('/')[-1]}')")
    
else:
    print("❌ No models found that support generateContent")
    print("This might indicate an API key issue or account limitation")

print("\n" + "=" * 70)
print("\n🔧 API KEY INFO:")
print(f"API Key starts with: {api_key[:10]}...")
print(f"API Key length: {len(api_key)} characters")