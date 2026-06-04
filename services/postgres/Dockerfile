FROM postgres:18-alpine

# Run any init scripts on first cluster initialization.
COPY scripts/ /docker-entrypoint-initdb.d/

# Ensure the final runtime user is non-root.
USER postgres
