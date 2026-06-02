from flask import Flask, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
import yfinance as yf
import requests
import os

load_dotenv()

app = Flask(__name__)
CORS(app)

API_KEY = os.getenv("TWELVE_DATA_API_KEY")

# Get historical data using yfinance (with safe browser headers)
@app.route("/stock/history/<ticker>")
def get_history(ticker):
    try:
        stock = yf.Ticker(ticker)
        
        # 1. Force historical request with an explicit 3-month period
        df = stock.history(period="3mo")
        
        # 2. Check if the dataframe actually contains data
        if df.empty:
            return jsonify({"error": f"No historical data found for {ticker}."}), 404
            
        # 3. Safely map dates and isolate the 'Close' column
        # (Handles cases where yfinance packages return a multi-index column)
        dates = [str(date).split()[0] for date in df.index]
        
        if "Close" in df.columns:
            prices = df["Close"].round(2).tolist()
        else:
            # Fallback for multi-index column data
            prices = df.iloc[:, df.columns.get_level_values(0) == 'Close'].iloc[:, 0].round(2).tolist()

        data = {
            "dates": dates,
            "prices": prices
        }
        return jsonify(data)
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Get current price using Twelve Data
@app.route("/stock/price/<ticker>")
def get_price(ticker):
    try:
        url = f"https://api.twelvedata.com/price?symbol={ticker}&apikey={API_KEY}"
        response = requests.get(url)
        return jsonify(response.json())
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Get basic stock info
@app.route("/stock/info/<ticker>")
def get_info(ticker):
    try:
        stock = yf.Ticker(ticker)
        info = stock.info
        data = {
            "name": info.get("longName", ticker),
            "sector": info.get("sector", "N/A"),
            "marketCap": info.get("marketCap", "N/A"),
            "peRatio": info.get("trailingPE", "N/A"),
        }
        return jsonify(data)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(debug=True)