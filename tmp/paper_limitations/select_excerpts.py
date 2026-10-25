from pathlib import Path
import json
rs=json.loads(Path('tmp/paper_limitations/clean.json').read_text(encoding='utf8'))
out={i:[] for i in range(1,17)}
def s(i,p,a,b):
 t=rs[i-1]['clean'][p-1]
 try:
  x=t.index(a); y=t.index(b,x)+len(b)
 except ValueError:
  print(f'Missing anchor paper {i} page {p}: {a!r} / {b!r}')
  out[i].append({'pages':[p],'text':'MISSING'})
  return
 out[i].append({'pages':[p],'text':t[x:y]})
def merge(i):
 b=out[i].pop(); a=out[i].pop(); out[i].append({'pages':a['pages']+b['pages'],'text':a['text']+' '+b['text']})

s(1,1,'Although, there exist a few websites','react to any fake news event [18].')
s(1,3,'Chen et al. [30]','prototype of their methodology.')
s(1,3,'Kaliyar et al. [36]','generalized text [37].')
s(1,4,'Ahmed et al. [48]','due to their very small size.')
s(1,4,'a) Benjamin Political News:','d) CREDBANK: consists of incomplete news articles in real and fake events categories.')
s(1,4,'f) FakeNewsNet:','without source information.')
s(1,4,'No single method guarantees','less than 4000 articles only.')
s(1,4,'Although there exist an important number','limitations in terms of size, category or bias.')

s(2,2,'Traditional approaches for FND','PolitiFact [6] and ClaimBuster [7]')
s(2,3,'are valuable but suffer','comprehensive coverage in the global landscape.')
merge(2)
s(2,3,'Classical ML approaches','characterize sophisticated misinformation.')
s(2,3,'Despite the promising capabilities','performance stability in various datasets.')
s(2,20,'In terms of improved performance,','fairness, adaptability, and ethical constraints.')

s(3,1,'However, this manual','verification is time-consuming.')
s(3,1,'On the one hand, methods','These approaches also do not offer any explanation of their verdicts.')
s(3,1,'On the other hand, Popat','bias and subjectivity in the language style.')
s(3,8,'The method proposed by Samadi','These approaches do not consider')
s(3,9,'the deeper semantic aspects','but do not consider credibility.')
merge(3)
s(3,9,'Nakashole and Mitchell (2014)','mainly suitable for use with structured data.')

s(4,3,'The model achieves F1 scores','compared to the')
s(4,4,'performance on the development set','articles from in-domain sources.')
merge(4)
s(4,5,'In contrast, the LIWC features','already learning from text.')
s(4,5,'As in the dev. set results,','hurt the performance slightly.')

s(5,17,'Although we suggest possible reasons','sentiment model, etc.')
s(5,17,'Although the experimental results','in the characteristics')
s(5,18,'of data across different domains.','of data across different domains.')
merge(5)
s(5,18,'Similarly, The challenging characteristics','much higher results on other datasets.')
s(5,18,'Nevertheless, ptVAE exhibits','SA-HyperGAT [162].')
s(5,20,'While the language used on each platform','making the processing of such data cumbersome.')
s(5,20,'However, achieving this goal','in a single language (typically English or Chinese).')
s(5,20,'The development of emotion-based misinformation','obtained in these ways are not sufficiently accurate.')
s(5,21,'Despite the value of these datasets','identification of rumor source, etc.')
s(5,21,'However, despite the high levels of performance','their decisions are hard to justify.')

s(6,20,'Although the studies mentioned above','The fakers mainly utilise different tactics to mimic trustworthy content.')
s(6,20,'However, high-quality data,','developing an automated solution with high accuracy is, therefore, challenging.')
s(6,24,'Although these studies showed significant performance,','context-independent word embedding techniques.')
s(6,24,'Fusing the relevant information','negative impact on the performance of the model.')
s(6,30,'As mentioned previously, although','overlook contextual information.')
s(6,30,'A bag-of-words model, as the name implies,','thus, failing to capture semantic patterns.')
s(6,30,'Another issue of such a model','resulting')
s(6,31,'in what is called sparse representations.','terrible out-of-sample performance.')
merge(6)
s(6,31,'The problem with the BoWs method','as rarer occurring words.')
s(6,32,'Y et, nevertheless, these techniques','a specific co-occurrence window.')
s(6,37,'In RNN, gradients are typically computed','unable to learn long-distance temporal dependencies.')
s(6,38,'The basic RNN only considers','cannot capture future context.')
s(6,38,'Even though BiLSTM and BiGRU','most salient parts of the contextual information of the text.')
s(6,43,'Classical ML algorithms, such as LR, SVM, etc.,','limited generalisation abilities.')
s(6,43,'Classical ML algorithms, including shallow neural networks,','increases the risk of overfitting.')
s(6,44,'However, CNN typically struggles','handling such dependencies.')
s(6,44,'However, besides the fact','understanding of a given input text.')
s(6,44,'However, research on FND','most effective for FND remains unanswered.')
s(6,44,'Despite the success of ML and DL models','combat fake news dissemination.')
s(6,45,'Driven by the high performance','obscure to humans.')
s(6,45,'Lack of empirical analysis:','discussed methods and techniques.')
s(6,45,'Limited discussion on real-world implementation:','realworld scenarios.')

# The two survey versions are extracted independently to preserve their wording.
def survey(i):
 def add(p,a,b): s(i,p,a,b)
 add(3,'Some earlier efforts do not use any','machine-generated claims (Schuster et al., 2020).')
 add(4,'A fundamental issue is that not all','(Augenstein et al., 2019).')
 add(4,'Debunking purely by calling','consequences (O’Neil, 2016).')
 add(5,'Presenting the evidence returned','process used to reach the verdict.')
 add(6,'However, the implicit assumption','(Uscinski and Butler, 2013).')
 if i==7:
  add(6,'A popular type of evidence often considered','useful when the latter are unavailable (Wang, 2017; Potthast et al., 2018), it')
  add(7,'does not provide evidence grounding the claim.','does not provide evidence grounding the claim.')
  merge(i)
 else:
  add(7,'A popular type of evidence often considered','does not provide evidence grounding the claim.')
 add(7,'The aforementioned works assume','from a large knowledge source.')
 add(7,'However, these efforts restricted','information that is necessary for verification is missing.')
 if i==7:
  add(7,'However, while graph topology','(Bordes et al., 2013; Socher et al., 2013).')
 else:
  add(7,'However, while graph topology','true facts relevant to the')
  add(8,'claim are present in the graph;','(Bordes et al., 2013; Socher et al., 2013).')
  merge(i)
 add(8,'Most existing datasets do not contain','for verdicts.')
 add(8,'Recently, Kotonya and Toni (2020b)','based on retrieved evidence.')
 add(8,'This is challenging, especially','retrieval and use of evidence.')
 add(9,'Some work avoids retrieval','unrealistic.')
 if i==7:
  add(9,'Without explicitly considering evidence','(Lee et al., 2021; Pan et al., 2021).')
  add(9,'Recent studies have shown','Some tokens with')
  add(10,'high attention scores','they lack readability.')
  merge(i)
 else:
  add(9,'Without explicitly considering evidence','learned during training, and')
  add(10,'render justification production impossible','(Lee et al., 2021; Pan et al., 2021).')
  merge(i)
  add(10,'Recent studies have shown','they lack readability.')
 add(10,'These rules are mined','knowledge base.')
 add(10,'A potential issue is that such models','which is unrealistic.')
 add(10,'Fact-checking can help detect misinformation,','distinguish it from disinformation.')
 lastpage=10 if i==7 else 11
 add(lastpage,'Nevertheless, new claims','outdated and potentially misleading over time.')
 add(11,'In-between labels like','label the full statement')
 # Keep the full final phrase including the quoted label via the next sentence boundary.
 t=rs[i-1]['clean'][10]; x=t.index('In-between labels like'); y=t.index('Noisy labels',x)
 out[i][-1]['text']=t[x:y].strip()
 add(11,'The separation of claims','into the existing frameworks.')
 add(11,'Not all information is equally trustworthy,','such as Wikipedia.')
 add(11,'Similarly, check-worthiness','target audience, recency, and geography.')
 add(11,'However, the practical limitations','(Uscinski and Butler, 2013; Uscinski, 2015).')
 add(11,'Synthetic datasets constructed','(Gururangan et al., 2018; Poliak et al., 2018; McCoy et al., 2019).')
 add(11,'For fact-checking, Schuster','remains an open question.')
 mp=11 if i==7 else 12
 add(mp,'Available multimodal corpora','(Nakamura et al., 2020).')
 add(12,'While misinformation spans','focused on English.')
 add(12,'Currently, there exist a handful','remains an open question.')
 add(12,'A significant unaddressed challenge','(Jacovi and Goldberg, 2020).')
 add(12,'Efforts have been made','introduced to the public.')
 rp=12 if i==7 else 13
 add(rp,'This could be seen as a form of dialogue agent','development of such systems.')
survey(7)

s(8,9,'The available experiment summary','We therefore do not report a fabricated significance value.')
s(8,12,'Short claims involving missing dates,','enough evidence to resolve factuality.')
s(8,12,'The integer cells are reconstructed','required for paired significance testing.')
s(8,20,'The results establish performance','against primary sources.')
s(8,20,'The reported experiment uses one fixed seed.','variation across random initializations ( 24, 32).')
s(8,20,'The study does not evaluate','probabilities of truth ( 22, 23).')
s(8,20,'LIAR contains English political claims','in-domain short-claim performance only.')
s(8,21,'The system does not retrieve primary sources,','rather than learned multimodal fusion.')

s(9,6,'It is worth mentioning that BERT input length','the rest of the text in long news articles.')
s(9,6,'Also, despite the huge amount of data','length greater than 512 words.')
s(9,7,'Constantly, new events are covered','unable to detect recent news.')
s(9,7,'Lastly, for both sentiment and im','Lastly, for both sentiment and im')
s(9,8,'ageability features,','across the segments match.')
merge(9)
out[9][-1]['text']=out[9][-1]['text'].replace('im ageability','imageability')

s(10,9,'Despite the promising results of deep learning methods','models across different datasets.')
s(10,9,'One major issue is the potential','by the dominance of the majority class.')
s(10,9,'Additionally, different datasets','poor detection performance [190], [191].')
s(10,11,'One of the main difficulties','mostly unlabeled or have only a few records labeled.')
s(10,11,'It is also clear from our findings','such as language features or size [199].')
s(10,11,'Sources of fake and non-fake news:','not all of them are trustworthy [200].')
s(10,11,'Bias in the data:','lead to unfair predictions [201].')
s(10,11,'Labeling issues:','Human labels')
s(10,12,'may be subjective,','limitations [197], [202].')
merge(10)
s(10,12,'Bots involvement:','inaccuracies in the dataset [200].')
s(10,12,'Rapid evolving nature of fake news:','comprehensive dataset and up-to-date [198], [203].')
s(10,15,'One initial aspect that we must highlight','for pre-training.')
s(10,15,'For instance, the choice of pre-trained models','still an active area of research.')
s(10,15,'Random under-sampling can be','potential loss of predictive performance.')
s(10,16,'Random over-sampling can help','if not done carefully.')
s(10,16,'Typically, specially developed algorithms','implement the modifications [231].')
s(10,16,'It should be noted that despite the effectiveness','investigated the class imbalance effect on fake news detection.')
s(10,16,'Class imbalance is a common problem','performance of the models [236].')
s(10,16,'One of the challenges related','correctly identifying the minority class.')
s(10,16,'In the FND domain, there is a lack','their effectiveness in fake news detection remains understudied.')
s(10,16,'An important challenge with','In this case, it is')
s(10,17,'necessary to generate complete texts','effectiveness of the model.')
merge(10)
s(10,17,'The context is also a challenge','fake news was generated.')
s(10,17,'Lastly, special-purpose algorithms','effectiveness in FND requires further investigation.')
s(10,18,'SLRs are prone to several threats','selected over negative studies.')
s(10,18,'Regarding filtering out studies','before 2018.')
for a,b in [
 ('Lack of labelled data:','for effective training.'),
 ('Potentially biased datasets:','performance and fairness of deep learning models.'),
 ('Lack of benchmarks:','[238].'),
 ('Transfer learning solutions not sufficiently explored:','exploration of transfer learning solutions is still limited.'),
 ('Class imbalance not adequately addressed:','needs further investigation.'),
 ('Limited understanding of fake news dynamics:','the models’ accuracy and effectiveness.'),
 ('Real-world applicability:','practical scenarios [198], [203].')]: s(10,19,a,b)

s(11,1,'Even though crowdsourcing is an important approach','completely different, simulated platform.')
s(11,1,'However, the lack of manually labeled','does not permit machine learning based assessments.')
s(11,2,'They are very useful datasets','much shorter than customer reviews.')
s(11,2,'However, with less than a thousand samples,','algorithms for fake news detection.')
s(11,3,'Since this vector also includes','in prediction experiments.')
s(11,4,'Due to overfitting,','the Bi-LSTMs did not perform well.')
out[12]=[dict(x) for x in out[3]]

s(13,1,'However, existing efforts','they cannot replace real-world datasets.')
s(13,3,'There were a number of crawling issues,','availability of articles and full texts differs as well.')
s(13,4,'We acknowledge that search results','see Table 3 for detailed statistics).')
s(13,4,'This clearly shows that most of the claims','most of the fact checking websites are US-based.')
s(13,5,'However, since the sheer number of labels','part of the veracity prediction model.')
s(13,6,'Such a model ignores evidence','surface patterns observed in the claim texts.')
s(13,6,'Here, we opt to encode search snippets','which we leave to future work.')
s(13,7,'No direct labels are available','learn evidence ranks implicitly.')
s(13,7,'The claim publication date is potentially relevant,','incorporating temporal information to future work.')
s(13,8,'Unsurprisingly, it is hard','using explicit wording.')
s(13,9,'We find that encoding metadata within the model','improves performance where it is.')
s(13,9,'One can observe that the model struggles','where evidence is ambiguous remain challenging.')

s(14,5,'The experiments performed with BERT-Base + feedforward','A')
# Replace the boundary with the full cross-page limitation paragraph.
out[14].pop()
s(14,6,'slight improvement of 1%','complexity of the input data.')
assert rs[13]['clean'][4].endswith('A')
out[14][-1]['text']='A '+out[14][-1]['text']
out[14][-1]['pages'].insert(0,5)
s(14,6,'The training loss VS validation Loss graphs','larger and more representative datasets of shorttext claims.')

survey(15)
s(16,1,'Incorporating emotion classification','choosing a set of basic emotions.')
s(16,1,'Due to unavailability of fake news datasets','in multi-task settings on both emotion sets.')
s(16,2,'We observed comparable performance','We observed comparable performance')
s(16,2,'between MTL models trained on Ekman','which performed worse with Plutchik emotions.')
merge(16)

titles=[
'WELFake: Word Embedding over Linguistic Features for Fake News Detection',
'Towards Reliable Fake News Detection: Enhanced Attention-Based Transformer Model',
'DeClarE: Debunking Fake News and False Claims using Evidence-Aware Deep Learning',
'Truth of Varying Shades: Analyzing Language in Fake News and Political Fact-Checking',
'Emotion Detection for Misinformation: A Review',
'A comprehensive survey on machine learning approaches for fake news detection',
'A Survey on Automated Fact-Checking',
'A Multi-Transformer Framework for Short-Claim Fake News Detection with Affective Feature Ablation',
'FakeFlow: Fake News Detection by Modeling the Flow of Affective Information',
'Fake News Detection Using Deep Learning: A Systematic Literature Review',
'“Liar, Liar Pants on Fire”: A New Benchmark Dataset for Fake News Detection',
'DeClarE: Debunking Fake News and False Claims using Evidence-Aware Deep Learning',
'MultiFC: A Real-World Multi-Domain Dataset for Evidence-Based Fact Checking of Claims',
'Sentimental LIAR: Extended Corpus and Deep Learning Models for Fake Claim Classification',
'A Survey on Automated Fact-Checking',
'An Emotion-Based Multi-Task Approach to Fake News Detection (Student Abstract)']
result=[dict(id=i,title=titles[i-1],file=rs[i-1]['file'],excerpts=out[i]) for i in range(1,17)]
Path('tmp/paper_limitations/selected.json').write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding='utf8')
print([(r['id'],len(r['excerpts']),sum(len(x['text'].split()) for x in r['excerpts'])) for r in result])
