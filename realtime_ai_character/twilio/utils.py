import re


def is_valid_e164(number: str):
    pattern = r"^\+[1-9]\d{1,14}$"
    match = re.match(pattern, number)
    if match:
        return True
    else:
        return False
