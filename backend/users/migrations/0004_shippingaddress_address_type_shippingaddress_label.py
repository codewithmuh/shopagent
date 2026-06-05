from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("users", "0003_remove_user_wallet_address"),
    ]

    operations = [
        migrations.AddField(
            model_name="shippingaddress",
            name="address_type",
            field=models.CharField(
                choices=[("home", "Home"), ("office", "Office"), ("other", "Other")],
                default="home",
                max_length=20,
            ),
        ),
        migrations.AddField(
            model_name="shippingaddress",
            name="label",
            field=models.CharField(
                blank=True,
                default="",
                help_text="Custom label e.g. 'Mom's house', 'Downtown office'",
                max_length=100,
            ),
        ),
    ]
