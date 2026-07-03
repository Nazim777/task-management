import os
import json
import socket
import urllib.request

DUCKDNS_TOKEN  = os.environ["DUCKDNS_TOKEN"]
DUCKDNS_DOMAIN = os.environ["DUCKDNS_DOMAIN"]
ALB_DNS        = os.environ["ALB_DNS"]

def handler(event, context):
    # Resolve ALB DNS to current IP
    alb_ip = socket.gethostbyname(ALB_DNS)

    # Update DuckDNS
    url = (
        f"https://www.duckdns.org/update"
        f"?domains={DUCKDNS_DOMAIN}"
        f"&token={DUCKDNS_TOKEN}"
        f"&ip={alb_ip}"
    )
    with urllib.request.urlopen(url) as res:
        body = res.read().decode()

    print(f"ALB IP: {alb_ip} | DuckDNS response: {body}")

    if body.strip() == "OK":
        return {"status": "updated", "ip": alb_ip}
    else:
        raise Exception(f"DuckDNS update failed: {body}")
