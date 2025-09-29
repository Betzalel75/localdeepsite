#!/bin/bash
# set api key into secrets/deepseek_api_key and secrets/gemini_api_key
mkdir -p secrets
echo $DEEPSEEK_API_KEY > secrets/deepseek_api_key
echo $GEMINI_API_KEY > secrets/gemini_api_key

# check if container is up
if docker compose ps | grep -q "Up"; then
    docker compose down
fi

docker compose --env-file .env.local up --build -d
