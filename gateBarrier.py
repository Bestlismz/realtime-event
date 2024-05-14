from flask import Flask, request
import requests
from dotenv import load_dotenv
import os

load_dotenv()

app = Flask(__name__)

@app.route('/api/open/barrierGate', methods=['POST'])
def open_barrier_gate():
    ip_address = os.getenv('IP_ADDRESS_GATE_OUT')
    username = os.getenv('USERNAME_GATE_OUT')
    password = os.getenv('PASSWORD_GATE_OUT')

    request_url = f'http://{ip_address}/ISAPI/Parking/channels/1/barrierGate'
    auth = requests.auth.HTTPDigestAuth(username, password)

    # Send the request and receive response
    body = "<?xml version: '1.0' encoding='utf-8'?><BarrierGate><ctrlMode>open</ctrlMode></BarrierGate>"
    response = requests.put(request_url, auth=auth, data=body)

    # Output response content
    print(response.text)

    return response.text


if __name__ == '__main__':
    app.run(port=8000)
