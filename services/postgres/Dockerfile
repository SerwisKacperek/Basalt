FROM postgres:18-alpine

COPY scripts/ /docker-entrypoint-initdb.d/

# Fix Windows CRLF line endings and ensure scripts are executable.
RUN sed -i 's/\r$//' /docker-entrypoint-initdb.d/*.sh \
    && chmod +x /docker-entrypoint-initdb.d/*.sh

USER postgres
