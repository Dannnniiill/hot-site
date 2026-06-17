from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('hotel', '0008_alter_bookingdate_comment'),
    ]

    operations = [
        migrations.RunSQL(
            """
            INSERT INTO hotel_room (id, number) VALUES (1, 201);
            INSERT INTO hotel_room (id, number) VALUES (2, 202);
            INSERT INTO hotel_room (id, number) VALUES (3, 203);
            INSERT INTO hotel_room (id, number) VALUES (4, 204);
            INSERT INTO hotel_room (id, number) VALUES (5, 205);
            INSERT INTO hotel_room (id, number) VALUES (6, 206);
            INSERT INTO hotel_room (id, number) VALUES (7, 207);
            INSERT INTO hotel_room (id, number) VALUES (8, 211);
            INSERT INTO hotel_room (id, number) VALUES (9, 212);
            INSERT INTO hotel_room (id, number) VALUES (10, 214);
            INSERT INTO hotel_room (id, number) VALUES (11, 215);
            INSERT INTO hotel_room (id, number) VALUES (12, 216);
            INSERT INTO hotel_room (id, number) VALUES (13, 217);
            INSERT INTO hotel_room (id, number) VALUES (14, 213);
            INSERT INTO hotel_room (id, number) VALUES (15, 218);
            INSERT INTO hotel_room (id, number) VALUES (16, 219);
            INSERT INTO hotel_room (id, number) VALUES (17, 220);
            INSERT INTO hotel_room (id, number) VALUES (18, 101);
            INSERT INTO hotel_room (id, number) VALUES (19, 102);
            INSERT INTO hotel_room (id, number) VALUES (20, 103);
            INSERT INTO hotel_room (id, number) VALUES (21, 104);
            INSERT INTO hotel_room (id, number) VALUES (22, 105);
            INSERT INTO hotel_room (id, number) VALUES (23, 208);
            INSERT INTO hotel_room (id, number) VALUES (24, 209);

            INSERT INTO hotel_luxe (id, price, persons) VALUES (1, 3400, 2);
            INSERT INTO hotel_luxe_rooms (id, luxe_id, room_id) VALUES (1, 1, 16);
            INSERT INTO hotel_luxe_rooms (id, luxe_id, room_id) VALUES (2, 1, 17);
            INSERT INTO hotel_luxe_rooms (id, luxe_id, room_id) VALUES (3, 1, 14);
            INSERT INTO hotel_luxe_rooms (id, luxe_id, room_id) VALUES (4, 1, 15);

            INSERT INTO hotel_luxeplus (id, price, persons) VALUES (1, 3700, 2);
            INSERT INTO hotel_luxeplus_rooms (id, luxeplus_id, room_id) VALUES (1, 1, 18);
            INSERT INTO hotel_luxeplus_rooms (id, luxeplus_id, room_id) VALUES (2, 1, 19);
            INSERT INTO hotel_luxeplus_rooms (id, luxeplus_id, room_id) VALUES (3, 1, 20);
            INSERT INTO hotel_luxeplus_rooms (id, luxeplus_id, room_id) VALUES (4, 1, 21);
            INSERT INTO hotel_luxeplus_rooms (id, luxeplus_id, room_id) VALUES (5, 1, 22);
            INSERT INTO hotel_luxeplus_rooms (id, luxeplus_id, room_id) VALUES (6, 1, 23);

            INSERT INTO hotel_luxepremium (id, price, persons) VALUES (1, 4200, 3);
            INSERT INTO hotel_luxepremium_rooms (id, luxepremium_id, room_id) VALUES (1, 1, 24);

            INSERT INTO hotel_standard (id, price, persons) VALUES (1, 2200, 1);
            INSERT INTO hotel_standard_rooms (id, standard_id, room_id) VALUES (1, 1, 1);
            INSERT INTO hotel_standard_rooms (id, standard_id, room_id) VALUES (2, 1, 2);
            INSERT INTO hotel_standard_rooms (id, standard_id, room_id) VALUES (3, 1, 3);
            INSERT INTO hotel_standard_rooms (id, standard_id, room_id) VALUES (4, 1, 4);
            INSERT INTO hotel_standard_rooms (id, standard_id, room_id) VALUES (5, 1, 5);
            INSERT INTO hotel_standard_rooms (id, standard_id, room_id) VALUES (6, 1, 6);
            INSERT INTO hotel_standard_rooms (id, standard_id, room_id) VALUES (7, 1, 7);
            INSERT INTO hotel_standard_rooms (id, standard_id, room_id) VALUES (8, 1, 8);
            INSERT INTO hotel_standard_rooms (id, standard_id, room_id) VALUES (9, 1, 9);
            INSERT INTO hotel_standard_rooms (id, standard_id, room_id) VALUES (10, 1, 10);
            INSERT INTO hotel_standard_rooms (id, standard_id, room_id) VALUES (11, 1, 11);
            INSERT INTO hotel_standard_rooms (id, standard_id, room_id) VALUES (12, 1, 12);
            INSERT INTO hotel_standard_rooms (id, standard_id, room_id) VALUES (13, 1, 13);
            """,
            reverse_sql="""
            DELETE FROM hotel_standard_rooms WHERE id IN (1,2,3,4,5,6,7,8,9,10,11,12,13);
            DELETE FROM hotel_standard WHERE id = 1;

            DELETE FROM hotel_luxepremium_rooms WHERE id = 1;
            DELETE FROM hotel_luxepremium WHERE id = 1;

            DELETE FROM hotel_luxeplus_rooms WHERE id IN (1,2,3,4,5,6);
            DELETE FROM hotel_luxeplus WHERE id = 1;

            DELETE FROM hotel_luxe_rooms WHERE id IN (1,2,3,4);
            DELETE FROM hotel_luxe WHERE id = 1;

            DELETE FROM hotel_room WHERE id IN (1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24);
            """
        ),
    ]