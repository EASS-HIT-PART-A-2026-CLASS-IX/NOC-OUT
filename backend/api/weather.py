import requests

def get_dc_weather(city: str):
    # כאן תזין את המפתח שלך מ-OpenWeatherMap
    API_KEY = "your_weather_key"
    url = f"https://api.openweathermap.org/data/2.5/weather?q={city}&appid={API_KEY}&units=metric"
    data = requests.get(url).json()
    return {
        "temp": data['main']['temp'],
        "condition": data['weather'][0]['main'],
        "status": "Optimal" if data['main']['temp'] < 25 else "Warning: High Temp"
    }