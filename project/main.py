from app import setup

app = setup()
app.secret_key = 'PepaLaCerdita'

if __name__ == "__main__":
    app.run(debug = True)