# 1. Use an official Python runtime as a parent image
# 'slim' versions are smaller and more efficient
FROM python:3.11-slim

# 2. Set the working directory inside the container
WORKDIR /app

# 3. Install system dependencies
# We need these to compile certain Python packages (like bcrypt) if wheels aren't available
RUN apt-get update && apt-get install -y \
    build-essential \
    libffi-dev \
    && rm -rf /var/lib/apt/lists/*

# 4. Copy the requirements file into the container
COPY requirements.txt .

# 5. Install Python dependencies
# --no-cache-dir keeps the image size small
RUN pip install --no-cache-dir -r requirements.txt

# 6. Copy the rest of the application code
COPY . .

# 7. Create a directory for uploads and the database
# This ensures they exist before we mount volumes
RUN mkdir -p uploads

# 8. Expose the port the app runs on
EXPOSE 8000

# 9. Define the command to run the app
# We use 0.0.0.0 so it's accessible from outside the container
CMD ["uvicorn", "server:app", "--host", "0.0.0.0", "--port", "8000"]
