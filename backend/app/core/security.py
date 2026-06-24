from slowapi import Limiter
from slowapi.util import get_remote_address

# Define the global rate limiter using the client's IP address
# This protects against basic application-layer DDoS attacks.
limiter = Limiter(key_func=get_remote_address, default_limits=["100/minute"])
