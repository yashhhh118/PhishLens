def check_keywords(text: str) -> dict:
    """
    Checks a string of text for suspicious phishing-related keywords.
    
    Suspicious words checked:
    verify, urgent, reward, bank, password, suspended, limited time, 
    winner, congratulations, click here, free, account blocked, immediate action.
    
    Returns a dictionary:
    {
        "found_keywords": list[str],
        "score": int,
        "explanation": list[str]
    }
    """
    if not isinstance(text, str):
        return {
            "found_keywords": [],
            "score": 0,
            "explanation": ["Invalid input: text must be a string."]
        }
        
    # Standardize text to lowercase for case-insensitive checking
    text_lower = text.lower()
    
    # Suspicious keywords mapped to their description categories
    suspicious_keywords = {
        "verify": "Verification/Credential word",
        "urgent": "Urgency word",
        "reward": "Offer/Reward word",
        "bank": "Financial/Bank keyword",
        "password": "Credential word",
        "suspended": "Account status word",
        "limited time": "Urgency/Scarcity word",
        "winner": "Reward/Winner keyword",
        "congratulations": "Reward/Congratulations keyword",
        "click here": "Call-to-action link",
        "free": "Offer word",
        "account blocked": "Account status word",
        "immediate action": "Urgency/Immediate action word"
    }
    
    found_keywords = []
    score = 0
    explanation = []
    
    for keyword, category in suspicious_keywords.items():
        if keyword in text_lower:
            found_keywords.append(keyword)
            score += 10
            explanation.append(f"{category} detected: {keyword}")
            
    return {
        "found_keywords": found_keywords,
        "score": score,
        "explanation": explanation
    }
