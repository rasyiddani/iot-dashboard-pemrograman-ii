from datetime import datetime
import json
from pathlib import Path

from flask import Flask, jsonify, render_template, request


app = Flask(__name__)

DATA_FILE = Path(__file__).with_name("data.json")


def default_data():
    return {
        "suhu": [],
        "lampu": {
            "status": "OFF",
            "history": []
        }
    }


def read_data():
    if not DATA_FILE.exists():
        return default_data()

    with DATA_FILE.open("r", encoding="utf-8") as file:
        data = json.load(file)

    # Migrasi sederhana jika data.json lama masih berbentuk list suhu.
    if isinstance(data, list):
        return {
            "suhu": data,
            "lampu": {
                "status": "OFF",
                "history": []
            }
        }

    data.setdefault("suhu", [])
    data.setdefault("lampu", {})
    data["lampu"].setdefault("status", "OFF")
    data["lampu"].setdefault("history", [])
    return data


def save_data(data):
    with DATA_FILE.open("w", encoding="utf-8") as file:
        json.dump(data, file, indent=4)


def now():
    return datetime.now().strftime("%Y-%m-%d %H:%M:%S")


@app.route("/")
def index():
    data = read_data()
    return render_template("index.html", data=data)


@app.route("/kirim")
def kirim():
    return render_template("kirim.html")


@app.route("/api/suhu", methods=["POST"])
def post_suhu():
    body = request.get_json(silent=True) or {}
    suhu = body.get("suhu")

    if suhu in (None, ""):
        return jsonify({
            "status": "error",
            "message": "Data suhu wajib diisi"
        }), 400

    try:
        suhu = float(suhu)
    except (TypeError, ValueError):
        return jsonify({
            "status": "error",
            "message": "Suhu harus berupa angka"
        }), 400

    new_data = {
        "timestamp": now(),
        "suhu": suhu
    }

    data = read_data()
    data["suhu"].append(new_data)
    save_data(data)

    return jsonify({
        "status": "success",
        "method": "POST",
        "message": "Data suhu berhasil disimpan",
        "data": new_data
    }), 201


@app.route("/api/suhu", methods=["GET"])
def get_suhu():
    data = read_data()
    return jsonify({
        "status": "success",
        "method": "GET",
        "data": data["suhu"]
    })


@app.route("/api/lampu", methods=["POST"])
def post_lampu():
    body = request.get_json(silent=True) or {}
    status_lampu = str(body.get("status", "")).upper()

    if status_lampu not in ("ON", "OFF"):
        return jsonify({
            "status": "error",
            "message": "Status lampu harus ON atau OFF"
        }), 400

    history_item = {
        "timestamp": now(),
        "status": status_lampu
    }

    data = read_data()
    data["lampu"]["status"] = status_lampu
    data["lampu"]["history"].append(history_item)
    save_data(data)

    return jsonify({
        "status": "success",
        "method": "POST",
        "message": f"Lampu berhasil diubah menjadi {status_lampu}",
        "data": data["lampu"]
    }), 201


@app.route("/api/lampu", methods=["GET"])
def get_lampu():
    data = read_data()
    return jsonify({
        "status": "success",
        "method": "GET",
        "data": data["lampu"]
    })


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
