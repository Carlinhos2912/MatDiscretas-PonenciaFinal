from app import setup

app = setup()
app.secret_key = 'nothingTooSerious'

if __name__ == "__main__":
    app.run(debug = True)