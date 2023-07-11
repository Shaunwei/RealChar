#!/usr/bin/env python

import click
import os
import subprocess


@click.group()
def cli():
    pass


@click.command()
@click.option('--name', default="realtime-ai-character", prompt='Docker image name', help='The name to give to your Docker image.')
@click.option('--rebuild', is_flag=True, help='Flag to indicate whether to rebuild the Docker image.')
def docker_build(name, rebuild):
    if rebuild or not image_exists(name):
        click.secho(f"Building Docker image: {name}...", fg='green')
        if (image_exists(name)):
            subprocess.run(["docker", "rmi", "-f", name])
        subprocess.run(["docker", "build", "-t", name, "."])
    else:
        click.secho(
            f"Docker image: {name} already exists. Skipping build.", fg='yellow')


@click.command()
@click.option('--name', default="realtime-ai-character", prompt='Docker image name', help='The name of the Docker image to run.')
@click.option('--db-file', default="./test.db", help='Path to the database file to mount inside the container.')
def docker_run(name, db_file):
    click.secho(f"Running Docker image: {name}...", fg='green')
    if not os.path.isfile('.env'):
        click.secho(
            "Warning: .env file not found. Running without environment variables.", fg='yellow')
    subprocess.run(["docker", "run", "--env-file", ".env", "--name", name, "-p", "8000:8000",
                   "-v", f"{os.path.abspath(db_file)}:/realtime_ai_character/test.db", name])


def image_exists(name):
    result = subprocess.run(
        ["docker", "image", "inspect", name], capture_output=True, text=True)
    return result.returncode == 0


cli.add_command(docker_build)
cli.add_command(docker_run)

if __name__ == '__main__':
    cli()
