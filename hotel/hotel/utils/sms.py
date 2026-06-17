import smtplib
import ssl

port = 465
smtp_server = 'smtp.yandex.ru'
sender_email = 'schastie-hotel@yandex.ru'
password = 'tnoleanooqxbofxg'

message = """Subject: {}\n\n{}"""


def send_email(receiver_email, subject, msg):
    context = ssl.create_default_context()
    with smtplib.SMTP_SSL(smtp_server, port, context=context) as server:
        server.login(sender_email, password)
        server.sendmail(sender_email, receiver_email, message.format(subject, msg).encode('utf-8'))
        server.close()

