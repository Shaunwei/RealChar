#!/usr/bin/env python
"""A CLI for building an running RealChar project locally."""
import click
import os
import subprocess
import sys


@click.group()
def cli():
    assert sys.version_info > (3, 10), "Python version must be newer than 3.10"
    pass


@click.command()
@click.option('--name', default="realtime-ai-character",
              help='The name to give to your Docker image.')
@click.option('--rebuild', is_flag=True,
              help='Flag to indicate whether to rebuild the Docker image.')
def docker_build(name, rebuild):
    if rebuild or not image_exists(name):
        click.secho(f"Building Docker image: {name}...", fg='green')
        if (image_exists(name)):
            subprocess.run(["docker", "rmi", "-f", name])
        subprocess.run(["docker", "build", "-t", name, "."])
    else:
        click.secho(
            f"Docker image: {name} already exists. Skipping build. " +
            "To rebuild, use --rebuild option", fg='yellow')


@click.command()
@click.option('--name', default="realtime-ai-character",
              help='The name of the Docker image to run.')
@click.option('--db-file', default=None,
              help='Path to the database file to mount inside the container.')
def docker_run(name, db_file):
    click.secho(f"Running Docker image: {name}...", fg='green')
    if not os.path.isfile('.env'):
        click.secho(
            "Warning: .env file not found. Running without environment variables.", fg='yellow')
    # Remove existing container if it exists
    subprocess.run(["docker", "rm", "-f", name],
                   stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    if db_file:
        subprocess.run(["docker", "run", "--env-file", ".env", "--name", name, "-p", "8000:8000",
                        "-v", f"{os.path.abspath(db_file)}:/realtime_ai_character/test.db", name])
    else:
        subprocess.run(["docker", "run", "--env-file", ".env",
                       "--name", name, "-p", "8000:8000", name])


@click.command()
@click.option('--name', default="realtime-ai-character",
              help='The name of the Docker image to delete.')
def docker_delete(name):
    if image_exists(name):
        click.secho(f"Deleting Docker image: {name}...", fg='green')
        subprocess.run(["docker", "rmi", "-f", name])
    else:
        click.secho(f"Docker image: {name} does not exist.", fg='yellow')


@click.command(context_settings={"ignore_unknown_options": True})
@click.argument('args', nargs=-1, type=click.UNPROCESSED)
def run_uvicorn(args):
    click.secho("Running uvicorn server...", fg='green')
    subprocess.run(["uvicorn", "realtime_ai_character.main:app",
                   "--ws-ping-interval", "60",
                    "--ws-ping-timeout", "60",
                    "--timeout-keep-alive", "60"] + list(args))


@click.command()
def web_build():
    # Build the web app to be served by FastAPI
    click.secho("Building web app...", fg='green')
    subprocess.run(["npm", "install"], cwd="client/web")
    click.secho("Web app dependencies installed.", fg='green')
    subprocess.run(["npm", "run", "build"], cwd="client/web")
    click.secho("Web app built.", fg='green')


@click.command()
@click.option('--file', '-f', default='client/next-web/.env', help='Path to the .env file.')
@click.option('--image-name', '-i', default='realchar-next-web', help='Name of the Docker image.')
def docker_next_web_build(file, image_name):
    """Build docker image using client/next-web/.env file for build arguments."""
    build_args = ""

    if not os.path.exists(file):
        click.echo(f"File '{file}' does not exist.")
        return

    with open(file, 'r') as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith("#"):
                key, value = line.split("=", 1)
                build_args += f" --build-arg {key}={value}"

    docker_command = f"docker build {build_args} -t {image_name} client/next-web"
    click.echo("Executing: " + docker_command)
    result = subprocess.run(docker_command.split())

    if result.returncode == 0:
        click.secho("Docker image built successfully.", fg='green')
    else:
        click.secho("Failed to build Docker image.", fg='red')


def image_exists(name):
    result = subprocess.run(
        ["docker", "image", "inspect", name], capture_output=True, text=True)
    return result.returncode == 0


cli.add_command(docker_build)
cli.add_command(docker_run)
cli.add_command(docker_delete)
cli.add_command(run_uvicorn)
cli.add_command(web_build)
cli.add_command(docker_next_web_build)


if __name__ == '__main__':
    cli()
