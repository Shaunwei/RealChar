class Singleton:
    _instances = {}

    @classmethod
    def get_instance(cls, *args, **kwargs):
        """ Static access method. """
        if cls not in cls._instances:
            cls._instances[cls] = cls(*args, **kwargs)
        return cls._instances[cls]

    @classmethod
    def initialize(cls, *args, **kwargs):
        """ Static access method. """
        if cls not in cls._instances:
            cls._instances[cls] = cls(*args, **kwargs)