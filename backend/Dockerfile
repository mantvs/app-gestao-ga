FROM python:3.11

# Diretório de trabalho direto no app
WORKDIR /workspace

# Copia os requisitos
COPY requirements.txt .

# Instala as dependências
RUN pip install --no-cache-dir -r requirements.txt

# Copia só arquivos da pasta com o código
COPY . .

# Substitui URLs hardcoded no código (ex: React localhost)
RUN find . -type f -name "*.py" -exec sed -i 's|http://localhost:3000|http://analytics-homologacao.mantoti.com.br|g' {} \;

# Executa o Uvicorn apontando pro arquivo correto
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]