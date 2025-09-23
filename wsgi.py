from app import app

if __name__ == "__main__":
    app.run()

# Vercel için
def handler(request):
    return app(request.environ, lambda *args: None)