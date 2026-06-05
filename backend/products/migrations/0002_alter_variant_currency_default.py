from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("products", "0001_initial"),
    ]

    operations = [
        migrations.AlterField(
            model_name="variant",
            name="currency",
            field=models.CharField(default="USD", max_length=10),
        ),
    ]
