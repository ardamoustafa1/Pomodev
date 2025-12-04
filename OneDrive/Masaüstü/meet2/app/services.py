import hashlib
import requests
from urllib.parse import urlencode
import xml.etree.ElementTree as ET
from flask import current_app


class BBBService:
    @staticmethod
    def _checksum(action, query):
        secret = current_app.config['BBB_SECRET']
        payload = action + query + secret
        return hashlib.sha1(payload.encode("utf-8")).hexdigest()

    @staticmethod
    def _request(action, params):
        base_url = current_app.config['BBB_URL']
        query = urlencode(params)
        checksum = BBBService._checksum(action, query)
        url = f"{base_url}/{action}?{query}&checksum={checksum}"

        try:
            response = requests.get(url, timeout=10)
            response.raise_for_status()
            return ET.fromstring(response.text)
        except Exception as e:
            print(f"BBB Connection Error: {e}")
            return None

    @classmethod
    def create_meeting(cls, name, m_id, mod_pw, att_pw):
        params = {
            "name": name,
            "meetingID": m_id,
            "attendeePW": att_pw,
            "moderatorPW": mod_pw,
            "record": "true",
            "allowStartStopRecording": "true",
            "webcamsOnlyForModerator": "false",
            "welcome": f"<br>Hoşgeldiniz: <b>{name}</b><br>"
        }
        root = cls._request("create", params)
        if root is not None and root.find("returncode").text == "SUCCESS":
            return True, "Oda başarıyla açıldı."
        return False, "BBB sunucusunda hata oluştu."

    @classmethod
    def get_join_url(cls, m_id, full_name, password):
        base_url = current_app.config['BBB_URL']
        params = {
            "fullName": full_name,
            "meetingID": m_id,
            "password": password,
            "redirect": "true"
        }
        query = urlencode(params)
        checksum = cls._checksum("join", query)
        return f"{base_url}/join?{query}&checksum={checksum}"

    @classmethod
    def end_meeting(cls, m_id, mod_pw):
        params = {"meetingID": m_id, "password": mod_pw}
        root = cls._request("end", params)
        return root is not None and root.find("returncode").text == "SUCCESS"