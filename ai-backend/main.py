import os

import uvicorn

from app.factory import create_app


app = create_app()


if __name__ == "__main__":
    port = int(os.getenv("PORT", "6201"))
    uvicorn.run(app, host="0.0.0.0", port=port)