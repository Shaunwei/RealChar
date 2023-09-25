import nltk
from nltk.tokenize import word_tokenize

from realtime_ai_character.utils import Singleton
from realtime_ai_character.logger import get_logger


question_words = ["what", "why", "when", "where", 
             "name", "is", "how", "do", "does", 
             "which", "are", "could", "would", 
             "should", "has", "have", "whom", "whose", "don't", "dont"]

def dialogue_act_features(post):
    features = {}
    for word in nltk.word_tokenize(post):
        features['contains({})'.format(word.lower())] = True
    return features

class Identifier(Singleton):
    def __init__(self) -> None:
        self.logger = get_logger("Timer")
        nltk.download('nps_chat')
        self.logger.info("Init NLP identifier...")
        posts = nltk.corpus.nps_chat.xml_posts()[:]
        featuresets = [(dialogue_act_features(post.text), post.get('class')) for post in posts]
        size = int(len(featuresets) * 0.1)
        train_set, test_set = featuresets[size:], featuresets[:size]
        self.classifier = nltk.NaiveBayesClassifier.train(train_set)
    
    def classify(self, s) ->str:
        return self.classifier.classify(dialogue_act_features(s))
    
    def isQuestion(self, s) -> bool:
        s = s.lower()
        token = word_tokenize(s)
        if any(x in token[0] for x in question_words):
            self.logger.info(f"{s} contains question words")
            return True
        cls = self.classify(s)
        if cls in ["ynQuestion", "whQuestion", "Clarify", "Emphasis"]:
            self.logger.info(f"{s} is considered as question and contains is classified as {cls}")
            return True
        self.logger.info(f"{s} contains is classified as {cls}")
        return False

def get_nlp_identifier():
    return Identifier.get_instance()