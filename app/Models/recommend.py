from flask import Flask, request, jsonify
import pandas as pd
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.feature_extraction.text import TfidfVectorizer

app = Flask(__name__)

# Load datasets
portfolios = pd.read_csv('performer_portfolio.csv')
feedback = pd.read_csv('feedbacks.csv')
highlights = pd.read_csv('highlight.csv')

# Helper: Compute Content-Based Recommendations
def recommend_performers(event_id, theme_id=None):
    # Filter portfolios based on event and theme
    event_portfolios = portfolios[portfolios['event_id'] == event_id]
    if theme_id:
        event_portfolios = event_portfolios[event_portfolios['theme_id'] == theme_id]

    # Feature extraction
    vectorizer = TfidfVectorizer()
    tfidf_matrix = vectorizer.fit_transform(event_portfolios['description'])

    # Compute cosine similarity
    similarity_scores = cosine_similarity(tfidf_matrix)

    # Rank performers by similarity and rating
    event_portfolios['similarity_score'] = similarity_scores.sum(axis=1)
    event_portfolios = event_portfolios.sort_values(
        by=['similarity_score', 'rating'], ascending=False)

    return event_portfolios.to_dict('records')

# API Endpoint
@app.route('/recommended', methods=['GET'])
def get_recommendations():
    event_id = request.args.get('event_id', type=int)
    theme_id = request.args.get('theme_id', type=int, default=None)

    try:
        recommendations = recommend_performers(event_id, theme_id)
        return jsonify({"status": "success", "data": {"recommended_performers": recommendations}})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)
