from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("merchants", "0001_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="merchant",
            name="country",
            field=models.CharField(
                default="US",
                help_text="Country code (US, GB, AE, PK, etc.)",
                max_length=5,
            ),
        ),
    ]
