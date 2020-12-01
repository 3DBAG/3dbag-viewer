<template>
  <div id="canvas" />
</template>

<script>

import {
	Scene,
	Color,
	FogExp2,
	WebGLRenderer,
	sRGBEncoding,
	RGBFormat,
	PerspectiveCamera,
	Group,
	Box3,
	DirectionalLight,
	PointLight,
	AmbientLight,
	Vector2,
	Vector3,
	Raycaster,
	MOUSE,
	TOUCH,
	ShaderMaterial,
	ShaderLib,
	UniformsUtils,
	Float32BufferAttribute,
	DataTexture,
	TextureLoader,
	Sprite,
	SpriteMaterial
} from 'three';
import {
	Lut
} from 'three/examples/jsm/math/Lut';
import {
	TilesRenderer
} from '../../3DTilesRendererJS/src/index.js';
import {
	WMSTilesRenderer,
	WMTSTilesRenderer
} from '../terrain-tiles';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { SSAOPass } from 'three/examples/jsm/postprocessing/SSAOPass.js';
import markerSprite from '@/assets/locationmarker.png';

const colormap_custom = [
	new Color( 0.9686274509803922, 0.9882352941176471, 0.9921568627450981 ),
	new Color( 0.9657977700884275, 0.9862668204536718, 0.9910495963091119 ),
	new Color( 0.9629680891964629, 0.9842983467896963, 0.9899423298731258 ),
	new Color( 0.9601384083044983, 0.982329873125721, 0.9888350634371396 ),
	new Color( 0.9573087274125336, 0.9803613994617455, 0.9877277970011534 ),
	new Color( 0.954479046520569, 0.9783929257977702, 0.9866205305651673 ),
	new Color( 0.9516493656286044, 0.9764244521337947, 0.9855132641291812 ),
	new Color( 0.9488196847366398, 0.9744559784698194, 0.9844059976931949 ),
	new Color( 0.9459900038446751, 0.9724875048058439, 0.9832987312572088 ),
	new Color( 0.9431603229527105, 0.9705190311418685, 0.9821914648212227 ),
	new Color( 0.9403306420607459, 0.9685505574778932, 0.9810841983852365 ),
	new Color( 0.9375009611687812, 0.9665820838139177, 0.9799769319492503 ),
	new Color( 0.9346712802768166, 0.9646136101499424, 0.9788696655132642 ),
	new Color( 0.931841599384852, 0.962645136485967, 0.977762399077278 ),
	new Color( 0.9290119184928873, 0.9606766628219916, 0.9766551326412919 ),
	new Color( 0.9261822376009228, 0.9587081891580161, 0.9755478662053056 ),
	new Color( 0.9233525567089581, 0.9567397154940408, 0.9744405997693195 ),
	new Color( 0.9205228758169934, 0.9547712418300655, 0.9733333333333334 ),
	new Color( 0.9176931949250289, 0.95280276816609, 0.9722260668973473 ),
	new Color( 0.9148635140330642, 0.9508342945021147, 0.971118800461361 ),
	new Color( 0.9120338331410995, 0.9488658208381392, 0.9700115340253749 ),
	new Color( 0.909204152249135, 0.9468973471741639, 0.9689042675893887 ),
	new Color( 0.9063744713571703, 0.9449288735101884, 0.9677970011534026 ),
	new Color( 0.9035447904652056, 0.942960399846213, 0.9666897347174164 ),
	new Color( 0.9007151095732411, 0.9409919261822376, 0.9655824682814302 ),
	new Color( 0.8978854286812764, 0.9390234525182622, 0.9644752018454441 ),
	new Color( 0.8950557477893117, 0.9370549788542869, 0.963367935409458 ),
	new Color( 0.8922260668973472, 0.9350865051903114, 0.9622606689734717 ),
	new Color( 0.8893963860053825, 0.9331180315263361, 0.9611534025374856 ),
	new Color( 0.886566705113418, 0.9311495578623606, 0.9600461361014995 ),
	new Color( 0.8837370242214533, 0.9291810841983853, 0.9589388696655133 ),
	new Color( 0.8809073433294886, 0.9272126105344098, 0.9578316032295271 ),
	new Color( 0.8779238754325259, 0.9251057285659362, 0.9566474432910419 ),
	new Color( 0.8738638985005767, 0.9220299884659747, 0.9549250288350635 ),
	new Color( 0.8698039215686274, 0.9189542483660131, 0.953202614379085 ),
	new Color( 0.8657439446366781, 0.9158785082660515, 0.9514801999231065 ),
	new Color( 0.861683967704729, 0.91280276816609, 0.9497577854671281 ),
	new Color( 0.8576239907727797, 0.9097270280661285, 0.9480353710111497 ),
	new Color( 0.8535640138408305, 0.9066512879661669, 0.9463129565551711 ),
	new Color( 0.8495040369088812, 0.9035755478662053, 0.9445905420991927 ),
	new Color( 0.845444059976932, 0.9004998077662437, 0.9428681276432141 ),
	new Color( 0.8413840830449827, 0.8974240676662822, 0.9411457131872357 ),
	new Color( 0.8373241061130334, 0.8943483275663207, 0.9394232987312573 ),
	new Color( 0.8332641291810842, 0.8912725874663591, 0.9377008842752788 ),
	new Color( 0.8292041522491349, 0.8881968473663976, 0.9359784698193003 ),
	new Color( 0.8251441753171858, 0.885121107266436, 0.9342560553633218 ),
	new Color( 0.8210841983852365, 0.8820453671664744, 0.9325336409073434 ),
	new Color( 0.8170242214532872, 0.8789696270665128, 0.9308112264513649 ),
	new Color( 0.812964244521338, 0.8758938869665513, 0.9290888119953864 ),
	new Color( 0.8089042675893887, 0.8728181468665898, 0.927366397539408 ),
	new Color( 0.8048442906574395, 0.8697424067666282, 0.9256439830834294 ),
	new Color( 0.8007843137254902, 0.8666666666666667, 0.923921568627451 ),
	new Color( 0.7967243367935409, 0.8635909265667051, 0.9221991541714726 ),
	new Color( 0.7926643598615917, 0.8605151864667435, 0.920476739715494 ),
	new Color( 0.7886043829296424, 0.857439446366782, 0.9187543252595156 ),
	new Color( 0.7845444059976932, 0.8543637062668205, 0.9170319108035371 ),
	new Color( 0.780484429065744, 0.8512879661668589, 0.9153094963475586 ),
	new Color( 0.7764244521337947, 0.8482122260668974, 0.9135870818915802 ),
	new Color( 0.7723644752018455, 0.8451364859669358, 0.9118646674356017 ),
	new Color( 0.7683044982698962, 0.8420607458669742, 0.9101422529796233 ),
	new Color( 0.764244521337947, 0.8389850057670126, 0.9084198385236448 ),
	new Color( 0.7601845444059977, 0.8359092656670511, 0.9066974240676663 ),
	new Color( 0.7561245674740484, 0.8328335255670896, 0.9049750096116879 ),
	new Color( 0.7520645905420992, 0.829757785467128, 0.9032525951557093 ),
	new Color( 0.7480046136101499, 0.8267435601691656, 0.9015916955017301 ),
	new Color( 0.7439446366782007, 0.8239138792772011, 0.9001153402537486 ),
	new Color( 0.7398846597462515, 0.8210841983852364, 0.898638985005767 ),
	new Color( 0.7358246828143022, 0.8182545174932718, 0.8971626297577855 ),
	new Color( 0.731764705882353, 0.8154248366013072, 0.895686274509804 ),
	new Color( 0.7277047289504037, 0.8125951557093425, 0.8942099192618224 ),
	new Color( 0.7236447520184545, 0.8097654748173779, 0.8927335640138409 ),
	new Color( 0.7195847750865052, 0.8069357939254133, 0.8912572087658592 ),
	new Color( 0.7155247981545559, 0.8041061130334486, 0.8897808535178777 ),
	new Color( 0.7114648212226067, 0.801276432141484, 0.8883044982698962 ),
	new Color( 0.7074048442906575, 0.7984467512495195, 0.8868281430219147 ),
	new Color( 0.7033448673587082, 0.7956170703575548, 0.8853517877739331 ),
	new Color( 0.6992848904267589, 0.7927873894655901, 0.8838754325259516 ),
	new Color( 0.6952249134948096, 0.7899577085736256, 0.88239907727797 ),
	new Color( 0.6911649365628605, 0.7871280276816609, 0.8809227220299884 ),
	new Color( 0.6871049596309112, 0.7842983467896962, 0.8794463667820069 ),
	new Color( 0.683044982698962, 0.7814686658977317, 0.8779700115340253 ),
	new Color( 0.6789850057670127, 0.778638985005767, 0.8764936562860438 ),
	new Color( 0.6749250288350636, 0.7758093041138024, 0.8750173010380623 ),
	new Color( 0.6708650519031142, 0.7729796232218378, 0.8735409457900807 ),
	new Color( 0.6668050749711649, 0.7701499423298731, 0.8720645905420992 ),
	new Color( 0.6627450980392157, 0.7673202614379085, 0.8705882352941177 ),
	new Color( 0.6586851211072664, 0.7644905805459439, 0.869111880046136 ),
	new Color( 0.6546251441753173, 0.7616608996539793, 0.8676355247981545 ),
	new Color( 0.650565167243368, 0.7588312187620146, 0.866159169550173 ),
	new Color( 0.6465051903114187, 0.75600153787005, 0.8646828143021914 ),
	new Color( 0.6424452133794695, 0.7531718569780854, 0.8632064590542099 ),
	new Color( 0.6383852364475202, 0.7503421760861207, 0.8617301038062284 ),
	new Color( 0.634325259515571, 0.7475124951941561, 0.8602537485582468 ),
	new Color( 0.6302652825836217, 0.7446828143021915, 0.8587773933102653 ),
	new Color( 0.6262053056516724, 0.7418531334102269, 0.8573010380622837 ),
	new Color( 0.6221453287197232, 0.7390234525182623, 0.8558246828143021 ),
	new Color( 0.6187773933102653, 0.7355017301038063, 0.8539792387543252 ),
	new Color( 0.616562860438293, 0.7308266051518647, 0.851518646674356 ),
	new Color( 0.6143483275663207, 0.7261514801999233, 0.8490580545943868 ),
	new Color( 0.6121337946943484, 0.7214763552479816, 0.8465974625144175 ),
	new Color( 0.609919261822376, 0.71680123029604, 0.8441368704344483 ),
	new Color( 0.6077047289504037, 0.7121261053440985, 0.841676278354479 ),
	new Color( 0.6054901960784314, 0.7074509803921569, 0.8392156862745098 ),
	new Color( 0.6032756632064591, 0.7027758554402154, 0.8367550941945405 ),
	new Color( 0.6010611303344867, 0.6981007304882738, 0.8342945021145713 ),
	new Color( 0.5988465974625145, 0.6934256055363323, 0.831833910034602 ),
	new Color( 0.5966320645905422, 0.6887504805843907, 0.8293733179546329 ),
	new Color( 0.5944175317185698, 0.6840753556324491, 0.8269127258746636 ),
	new Color( 0.5922029988465974, 0.6794002306805076, 0.8244521337946943 ),
	new Color( 0.5899884659746252, 0.6747251057285659, 0.8219915417147251 ),
	new Color( 0.5877739331026528, 0.6700499807766244, 0.8195309496347558 ),
	new Color( 0.5855594002306805, 0.6653748558246828, 0.8170703575547866 ),
	new Color( 0.5833448673587083, 0.6606997308727413, 0.8146097654748173 ),
	new Color( 0.5811303344867359, 0.6560246059207997, 0.8121491733948482 ),
	new Color( 0.5789158016147636, 0.6513494809688583, 0.809688581314879 ),
	new Color( 0.5767012687427913, 0.6466743560169166, 0.8072279892349097 ),
	new Color( 0.574486735870819, 0.641999231064975, 0.8047673971549404 ),
	new Color( 0.5722722029988466, 0.6373241061130335, 0.8023068050749712 ),
	new Color( 0.5700576701268744, 0.6326489811610919, 0.7998462129950019 ),
	new Color( 0.567843137254902, 0.6279738562091504, 0.7973856209150327 ),
	new Color( 0.5656286043829297, 0.6232987312572088, 0.7949250288350634 ),
	new Color( 0.5634140715109573, 0.6186236063052672, 0.7924644367550941 ),
	new Color( 0.5611995386389851, 0.6139484813533258, 0.790003844675125 ),
	new Color( 0.5589850057670127, 0.6092733564013841, 0.7875432525951558 ),
	new Color( 0.5567704728950404, 0.6045982314494426, 0.7850826605151865 ),
	new Color( 0.5545559400230681, 0.599923106497501, 0.7826220684352172 ),
	new Color( 0.5523414071510958, 0.5952479815455595, 0.780161476355248 ),
	new Color( 0.5501268742791234, 0.5905728565936179, 0.7777008842752787 ),
	new Color( 0.5490196078431373, 0.5855901576316801, 0.7751787773933103 ),
	new Color( 0.5490196078431373, 0.5802998846597462, 0.7725951557093426 ),
	new Color( 0.5490196078431373, 0.5750096116878124, 0.7700115340253749 ),
	new Color( 0.5490196078431373, 0.5697193387158785, 0.7674279123414072 ),
	new Color( 0.5490196078431373, 0.5644290657439448, 0.7648442906574395 ),
	new Color( 0.5490196078431373, 0.5591387927720108, 0.7622606689734718 ),
	new Color( 0.5490196078431373, 0.5538485198000769, 0.759677047289504 ),
	new Color( 0.5490196078431373, 0.548558246828143, 0.7570934256055364 ),
	new Color( 0.5490196078431373, 0.5432679738562092, 0.7545098039215686 ),
	new Color( 0.5490196078431373, 0.5379777008842753, 0.7519261822376009 ),
	new Color( 0.5490196078431373, 0.5326874279123415, 0.7493425605536332 ),
	new Color( 0.5490196078431373, 0.5273971549404075, 0.7467589388696655 ),
	new Color( 0.5490196078431373, 0.5221068819684737, 0.7441753171856978 ),
	new Color( 0.5490196078431373, 0.5168166089965398, 0.7415916955017301 ),
	new Color( 0.5490196078431373, 0.511526336024606, 0.7390080738177625 ),
	new Color( 0.5490196078431373, 0.5062360630526721, 0.7364244521337947 ),
	new Color( 0.5490196078431373, 0.5009457900807381, 0.733840830449827 ),
	new Color( 0.5490196078431373, 0.4956555171088043, 0.7312572087658593 ),
	new Color( 0.5490196078431373, 0.49036524413687044, 0.7286735870818916 ),
	new Color( 0.5490196078431373, 0.4850749711649366, 0.7260899653979238 ),
	new Color( 0.5490196078431373, 0.47978469819300285, 0.7235063437139563 ),
	new Color( 0.5490196078431373, 0.4744944252210688, 0.7209227220299884 ),
	new Color( 0.5490196078431373, 0.4692041522491349, 0.7183391003460208 ),
	new Color( 0.5490196078431373, 0.46391387927720107, 0.715755478662053 ),
	new Color( 0.5490196078431373, 0.4586236063052672, 0.7131718569780854 ),
	new Color( 0.5490196078431373, 0.45333333333333337, 0.7105882352941176 ),
	new Color( 0.5490196078431373, 0.44804306036139946, 0.7080046136101499 ),
	new Color( 0.5490196078431373, 0.44275278738946555, 0.7054209919261822 ),
	new Color( 0.5490196078431373, 0.4374625144175317, 0.7028373702422145 ),
	new Color( 0.5490196078431373, 0.43217224144559785, 0.7002537485582468 ),
	new Color( 0.5490196078431373, 0.426881968473664, 0.6976701268742791 ),
	new Color( 0.5490196078431373, 0.42159169550173015, 0.6950865051903115 ),
	new Color( 0.5487120338331412, 0.4163783160322953, 0.6925797770088428 ),
	new Color( 0.5482199154171473, 0.41121107266435986, 0.6901191849288735 ),
	new Color( 0.5477277970011535, 0.40604382929642446, 0.6876585928489043 ),
	new Color( 0.5472356785851596, 0.40087658592848907, 0.685198000768935 ),
	new Color( 0.5467435601691658, 0.3957093425605538, 0.6827374086889658 ),
	new Color( 0.5462514417531719, 0.39054209919261823, 0.6802768166089965 ),
	new Color( 0.545759323337178, 0.38537485582468284, 0.6778162245290272 ),
	new Color( 0.5452672049211842, 0.3802076124567474, 0.675355632449058 ),
	new Color( 0.5447750865051904, 0.375040369088812, 0.6728950403690888 ),
	new Color( 0.5442829680891965, 0.3698731257208766, 0.6704344482891196 ),
	new Color( 0.5437908496732027, 0.36470588235294116, 0.6679738562091503 ),
	new Color( 0.5432987312572088, 0.35953863898500577, 0.6655132641291811 ),
	new Color( 0.5428066128412149, 0.3543713956170704, 0.6630526720492118 ),
	new Color( 0.5423144944252211, 0.3492041522491349, 0.6605920799692426 ),
	new Color( 0.5418223760092272, 0.34403690888119953, 0.6581314878892733 ),
	new Color( 0.5413302575932334, 0.33886966551326414, 0.6556708958093042 ),
	new Color( 0.5408381391772396, 0.3337024221453287, 0.6532103037293349 ),
	new Color( 0.5403460207612457, 0.3285351787773933, 0.6507497116493657 ),
	new Color( 0.5398539023452519, 0.3233679354094579, 0.6482891195693964 ),
	new Color( 0.539361783929258, 0.31820069204152246, 0.6458285274894271 ),
	new Color( 0.5388696655132642, 0.31303344867358723, 0.643367935409458 ),
	new Color( 0.5383775470972703, 0.3078662053056517, 0.6409073433294886 ),
	new Color( 0.5378854286812764, 0.3026989619377163, 0.6384467512495194 ),
	new Color( 0.5373933102652826, 0.29753171856978083, 0.6359861591695501 ),
	new Color( 0.5369011918492888, 0.2923644752018454, 0.633525567089581 ),
	new Color( 0.5364090734332949, 0.28719723183391, 0.6310649750096117 ),
	new Color( 0.5359169550173011, 0.2820299884659746, 0.6286043829296425 ),
	new Color( 0.5354248366013072, 0.2768627450980392, 0.6261437908496732 ),
	new Color( 0.5349327181853133, 0.2716955017301038, 0.623683198769704 ),
	new Color( 0.5344405997693195, 0.26652825836216837, 0.6212226066897347 ),
	new Color( 0.5339484813533256, 0.261361014994233, 0.6187620146097655 ),
	new Color( 0.5334563629373318, 0.25619377162629753, 0.6163014225297963 ),
	new Color( 0.5326874279123414, 0.2502883506343714, 0.612641291810842 ),
	new Color( 0.5318262206843521, 0.24413687043444826, 0.6085813148788928 ),
	new Color( 0.5309650134563629, 0.23798539023452517, 0.6045213379469435 ),
	new Color( 0.5301038062283737, 0.23183391003460208, 0.6004613610149943 ),
	new Color( 0.5292425990003845, 0.22568242983467912, 0.5964013840830451 ),
	new Color( 0.5283813917723952, 0.21953094963475586, 0.5923414071510957 ),
	new Color( 0.527520184544406, 0.21337946943483274, 0.5882814302191465 ),
	new Color( 0.5266589773164168, 0.20722798923490965, 0.5842214532871972 ),
	new Color( 0.5257977700884275, 0.20107650903498653, 0.580161476355248 ),
	new Color( 0.5249365628604383, 0.1949250288350634, 0.5761014994232987 ),
	new Color( 0.524075355632449, 0.18877354863514031, 0.5720415224913495 ),
	new Color( 0.5232141484044598, 0.18262206843521722, 0.5679815455594003 ),
	new Color( 0.5223529411764706, 0.1764705882352941, 0.563921568627451 ),
	new Color( 0.5214917339484814, 0.170319108035371, 0.5598615916955018 ),
	new Color( 0.5206305267204921, 0.16416762783544792, 0.5558016147635525 ),
	new Color( 0.5197693194925028, 0.1580161476355248, 0.5517416378316032 ),
	new Color( 0.5189081122645136, 0.15186466743560167, 0.547681660899654 ),
	new Color( 0.5180469050365244, 0.14571318723567858, 0.5436216839677047 ),
	new Color( 0.5171856978085352, 0.1395617070357555, 0.5395617070357555 ),
	new Color( 0.516324490580546, 0.13341022683583237, 0.5355017301038062 ),
	new Color( 0.5154632833525568, 0.12725874663590944, 0.5314417531718572 ),
	new Color( 0.5146020761245674, 0.12110726643598616, 0.5273817762399078 ),
	new Color( 0.5137408688965782, 0.11495578623606306, 0.5233217993079585 ),
	new Color( 0.512879661668589, 0.10880430603613994, 0.5192618223760093 ),
	new Color( 0.5120184544405998, 0.10265282583621685, 0.51520184544406 ),
	new Color( 0.5111572472126105, 0.09650134563629373, 0.5111418685121107 ),
	new Color( 0.5102960399846213, 0.09034986543637064, 0.5070818915801615 ),
	new Color( 0.509434832756632, 0.08419838523644751, 0.5030219146482122 ),
	new Color( 0.5085736255286428, 0.07804690503652442, 0.49896193771626296 ),
	new Color( 0.5077124183006536, 0.0718954248366013, 0.4949019607843137 ),
	new Color( 0.5068512110726643, 0.06574394463667821, 0.49084198385236444 ),
	new Color( 0.5059900038446751, 0.059592464436755116, 0.4867820069204152 ),
	new Color( 0.5002845059592465, 0.057208765859284895, 0.4809996155324875 ),
	new Color( 0.4938869665513264, 0.05536332179930797, 0.47497116493656283 ),
	new Color( 0.4874894271434064, 0.05351787773933103, 0.4689427143406382 ),
	new Color( 0.48109188773548633, 0.0516724336793541, 0.46291426374471356 ),
	new Color( 0.47469434832756646, 0.04982698961937722, 0.4568858131487891 ),
	new Color( 0.46829680891964626, 0.047981545559400235, 0.4508573625528643 ),
	new Color( 0.4618992695117262, 0.04613610149942331, 0.44482891195693963 ),
	new Color( 0.45550173010380623, 0.04429065743944637, 0.43880046136101497 ),
	new Color( 0.4491041906958862, 0.04244521337946944, 0.43277201076509036 ),
	new Color( 0.44270665128796616, 0.04059976931949251, 0.4267435601691657 ),
	new Color( 0.4363091118800461, 0.038754325259515575, 0.42071510957324104 ),
	new Color( 0.4299115724721261, 0.03690888119953864, 0.4146866589773164 ),
	new Color( 0.42351403306420604, 0.03506343713956171, 0.4086582083813918 ),
	new Color( 0.417116493656286, 0.03321799307958478, 0.4026297577854671 ),
	new Color( 0.410718954248366, 0.03137254901960784, 0.39660130718954245 ),
	new Color( 0.404321414840446, 0.029527104959630915, 0.39057285659361785 ),
	new Color( 0.39792387543252594, 0.02768166089965398, 0.3845444059976932 ),
	new Color( 0.3915263360246059, 0.025836216839677052, 0.3785159554017685 ),
	new Color( 0.38512879661668586, 0.023990772779700117, 0.3724875048058439 ),
	new Color( 0.3787312572087658, 0.022145328719723183, 0.36645905420991925 ),
	new Color( 0.372333717800846, 0.020299884659746303, 0.3604306036139948 ),
	new Color( 0.3659361783929258, 0.01845444059976932, 0.35440215301807 ),
	new Color( 0.3595386389850057, 0.016608996539792392, 0.3483737024221453 ),
	new Color( 0.3531410995770857, 0.014763552479815457, 0.34234525182622066 ),
	new Color( 0.3467435601691657, 0.012918108419838523, 0.33631680123029606 ),
	new Color( 0.34034602076124565, 0.011072664359861595, 0.3302883506343714 ),
	new Color( 0.33394848135332567, 0.00922722029988466, 0.32425990003844674 ),
	new Color( 0.32755094194540557, 0.007381776239907725, 0.31823144944252213 ),
	new Color( 0.3211534025374856, 0.005536332179930797, 0.31220299884659747 ),
	new Color( 0.3147558631295655, 0.0036908881199538626, 0.3061745482506728 ),
	new Color( 0.3083583237216455, 0.0018454440599769348, 0.3001460976547482 ),
	new Color( 0.30196078431372547, 0.0, 0.29411764705882354 )
];

const Tweakpane = require( 'tweakpane' );

export default {
	name: 'ThreeViewer',
	props: {
		tilesUrl: {
			type: String,
			default: 'http://godzilla.bk.tudelft.nl/3dtiles/ZuidHolland/lod13/tileset1.json'
		},
		basemapOptions: {
			type: Object,
			default: () => {

				return {
					type: "wmts",
					options: {
						url: 'https://geodata.nationaalgeoregister.nl/tiles/service/wmts?',
						layer: 'brtachtergrondkaart',
						style: 'default',
						tileMatrixSet: "EPSG:28992",
						service: "WMTS",
						request: "GetTile",
						version: "1.0.0",
						format: "image/png"
					}
				};

			}
		}
	},
	watch: {
		tilesUrl: function ( val ) {

			this.reinitTiles();
			this.needsRerender = 1;

		},
		basemapOptions: function ( val ) {

			this.reinitBasemap();
			this.needsRerender = 1;

		},
		$route( to, from ) {

			this.setCameraPosFromRoute( to.query );

		},
	},
	beforeCreate() {

		this.renderer = null;
		this.scene = null;
		this.offsetParent = null;
		this.camera = null;
		this.dummyCamera = null;
		this.controls = null;
		this.material = null;
		this.highlightMaterial = null;

		this.raycaster = null;
		this.mouse = null;

		this.box = null;

		this.tiles = null;

		this.needsRerender = 0;

		this.pointerCaster = {
			startClientX: 0,
			startClientY: 0
		};

		// debug
		this.lruCacheSize = 0;
		this.lruCacheMinSize = 175;
		this.lruCacheMaxSize = 250;

		this.pointIntensity = 0.4;
		this.directionalIntensity = 0.8;
		this.ambientIntensity = 0.5;

		this.dirX = 0.63;
		this.dirY = 1;
		this.dirZ = 0;

		this.meshShading = "normal";
		this.meshColor = "#c4c8cf";

		this.nearPlane = 1;
		this.farPlane = 10000;
		this.dummyFarPlane = 3500;

		this.fog = null;
		this.enableFog = false;
		this.fogDensity = 0.0004;
		this.fogColor = '#eeeeee';

		this.errorTarget = 0;
		this.errorThreshold = 60;

		this.castOnHover = false;

		this.enableWMS = true;
		this.pane = null;

		this.markerName = "locationMarker";
		this.selectedObject = null;

		this.enableAttributeColoring = true;
		this.colorAttrMinVal = 0.0;
		this.colorAttrMaxVal = 1.0;
		this.colorAttrName = "_rmse";

	},
	mounted() {

		this.initScene();
		this.initTweakPane();

	},
	methods: {
		// Adjusts the three.js standard shader to include batchid highlight
		batchIdHighlightShaderMixin( shader ) {

			const newShader = { ...shader };
			// var cmlut = new Lut( 'cooltowarm', 256 );
			// cmlut.addColorMap( 'viridis', cm_hot );
			// cmlut.changeColorMap( 'viridis' );
			const cm_data = new Uint8Array( 3 * 256 );
			// cmlut.lut.forEach( ( col, i ) => {
			colormap_custom.forEach( ( col, i ) => {

				var r = Math.floor( col.r * 255 );
				var g = Math.floor( col.g * 255 );
				var b = Math.floor( col.b * 255 );

				var stride = i * 3;

				cm_data[ stride ] = r;
				cm_data[ stride + 1 ] = g;
				cm_data[ stride + 2 ] = b;

			} );
			const cm = new DataTexture( cm_data, 256, 1, RGBFormat );

			newShader.uniforms = {
				valMin: { value: this.colorAttrMinVal },
				valMax: { value: this.colorAttrMaxVal },
				enableAttributeColoring: { value: this.enableAttributeColoring },
				colormap: { type: "t", value: cm },
				highlightedBatchId: { value: - 1 },
				highlightColor: { value: new Color( 0xFFC107 ).convertSRGBToLinear() },
				...UniformsUtils.clone( shader.uniforms ),
			};
			newShader.extensions = {
				derivatives: true,
			};
			newShader.lights = true;
			newShader.fog = true;
			newShader.vertexShader =
				`
					attribute float _batchid;
					attribute float attrValue;
					uniform float valMin;
					uniform float valMax;
					uniform float opacity;
					uniform vec3 diffuse;
					uniform int enableAttributeColoring;
					uniform float highlightedBatchId;
					uniform vec3 highlightColor;
					uniform sampler2D colormap;
					varying vec4 diffuseColor_;
				` +
				newShader.vertexShader.replace(
					/#include <uv_vertex>/,
					`
					#include <uv_vertex>
					vec3 diffuse_;
					if ( enableAttributeColoring != 0 ) {
						float texCoord = (attrValue - valMin)/(valMax - valMin);
						texCoord = clamp(texCoord, 0.0, 1.0);
						diffuse_ = texture2D( colormap, vec2(texCoord,0) ).xyz;
					} else {
						diffuse_ = diffuse;
					}
					diffuseColor_ =
						_batchid == highlightedBatchId ?
						vec4( highlightColor, opacity ) :
						vec4( diffuse_, opacity );
					`
				);
			newShader.fragmentShader =
				`
					varying vec4 diffuseColor_;
					
				` +
				newShader.fragmentShader.replace(
					/vec4 diffuseColor = vec4\( diffuse, opacity \);/,
					`
					vec4 diffuseColor = diffuseColor_;
					`
				);

			return newShader;

		},
		initTweakPane() {

			var el = document.getElementById( "debug-panel" );
			el.setAttribute( "style", "position: absolute; top: 3.75rem;right: 0.5rem;" );
			el.setAttribute( "class", "is-hidden-mobile" );
			this.pane = new Tweakpane( { title: 'debug', expanded: false, container: el } );

			// Camera
			const f3 = this.pane.addFolder( {
				expanded: false,
				title: 'Camera',
			} );
			f3.addInput( this, "nearPlane", { min: 1, max: 1000 } ).on( 'change', ( val ) => {

				this.camera.near = val; this.camera.updateProjectionMatrix();

			} );
			f3.addInput( this, "farPlane", { min: 100, max: 20000 } ).on( 'change', ( val ) => {

				this.camera.far = val; this.camera.updateProjectionMatrix();

			} );
			f3.addInput( this, "dummyFarPlane", { min: 100, max: 5000 } ).on( 'change', ( val ) => {

				this.dummyCamera.far = val; this.dummyCamera.updateProjectionMatrix();

			} );

			f3.addInput( this, "enableFog" ).on( 'change', ( val ) => val ? this.scene.fog = this.fog : this.scene.fog = null );
			f3.addInput( this, "fogDensity", { min: 0.0001, max: 0.01 } ).on( 'change', ( val ) => this.fog.density = val );
			f3.addInput( this, "fogColor" ).on( 'change', ( val ) => {

				this.fog.color.set( val ); this.scene.background.set( val );

			} );

			// Appearance
			const f4 = this.pane.addFolder( {
				expanded: false,
				title: 'Appearance',
			} );
			f4.addInput( this, "ambientIntensity", { min: 0, max: 2, step: 0.1 } ).on( 'change', ( val ) => {

				this.ambLight.intensity = val;

			} );
			f4.addInput( this, "directionalIntensity", { min: 0, max: 2, step: 0.1 } ).on( 'change', ( val ) => {

				this.dirLight.intensity = val;

			} );
			f4.addInput( this, "pointIntensity", { min: 0, max: 2, step: 0.1 } ).on( 'change', ( val ) => {

				this.pLight.intensity = val;

			} );
			const f5 = f4.addFolder( {
				expanded: false,
				title: 'PointLight dir',
			} ).on( 'change', ( val ) => this.dirLight.position.set( this.dirX, this.dirY, this.dirZ ) );
			f5.addInput( this, "dirX", { min: 0, max: 1, step: 0.01 } );
			f5.addInput( this, "dirY", { min: 0, max: 1, step: 0.01 } );
			f5.addInput( this, "dirZ", { min: 0, max: 1, step: 0.01 } );

			f4.addInput( this, "meshShading", { options: { normal: "normal", SSAO: "ssao" } } );
			f4.addInput( this, "meshColor" ).on( 'change', ( val ) => {

				this.material.uniforms.diffuse.value = new Color( val ).convertSRGBToLinear();
				this.highlightMaterial.uniforms.diffuse.value = new Color( val ).convertSRGBToLinear();

			} );

			// Misc
			const f6 = this.pane.addFolder( {
				expanded: false,
				title: 'Misc',
			} );
			f6.addInput( this, "castOnHover" );

			// Attribute-based building coloring
			const fac = this.pane.addFolder( {
				expanded: false,
				title: 'AttributeColoring',
			} );
			fac.addInput( this, "enableAttributeColoring" ).on( 'change', ( val ) => {

				this.material.uniforms.enableAttributeColoring.value = val;
				this.highlightMaterial.uniforms.enableAttributeColoring.value = val;

				if ( val ) {

					this.reinitTiles();

				}

			} );
			fac.addInput( this, "colorAttrMinVal" ).on( 'change', ( val ) => {

				this.material.uniforms.valMin.value = parseFloat( val );
				this.highlightMaterial.uniforms.valMin.value = parseFloat( val );

			} );
			fac.addInput( this, "colorAttrMaxVal" ).on( 'change', ( val ) => {

				this.material.uniforms.valMax.value = parseFloat( val );
				this.highlightMaterial.uniforms.valMax.value = parseFloat( val );

			} );
			fac.addInput( this, "colorAttrName", { options: {
				rmse: "_rmse",
				m2pc_error_max: "_m2pc_error_max",
				t_run: "_t_run",
				data_coverage: "_data_coverage",
				nodata_area: "_nodata_area"
			} } ).on( 'change', ( val ) => {

				this.reinitTiles();

			} );
			// stats
			const f7 = this.pane.addFolder( {
				expanded: false,
				title: 'Stats',
			} );
			f7.addMonitor( this.tiles.stats, "parsing" );
			f7.addMonitor( this.tiles.stats, "downloading" );
			f7.addMonitor( this.tiles.stats, "failed" );
			f7.addMonitor( this.tiles.stats, "inFrustum" );
			f7.addMonitor( this.tiles.stats, "used" );
			f7.addMonitor( this.tiles.stats, "active" );
			f7.addMonitor( this.tiles.stats, "visible" );
			f7.addMonitor( this, "lruCacheSize" );
			f7.addInput( this, "lruCacheMinSize", { min: 10, max: 500, step: 1 } )
				.on( 'change', ( val ) => {

					this.tiles.lruCache.minSize = val;

				} );
			f7.addInput( this, "lruCacheMaxSize", { min: 10, max: 500, step: 1 } )
				.on( 'change', ( val ) => {

					this.tiles.lruCache.maxSize = val;

				} );

			this.pane.on( "change", ( val ) => this.needsRerender = 1 );

		},
		setCameraPosFromRoute( q ) {

			let rd_x = parseFloat( q.rdx );
			let rd_y = parseFloat( q.rdy );
			let ox = parseFloat( q.ox );
			let oy = parseFloat( q.oy );
			let oz = parseFloat( q.oz );
			// compute local tileset coordinates

			if ( isNaN( rd_x ) ) {

				return;

			}
			let tileset_offset_x = this.tiles.root.cached.transform.elements[ 12 ];
			let tileset_offset_y = this.tiles.root.cached.transform.elements[ 13 ];
			let local_x = rd_x - tileset_offset_x;
			let local_y = 0;
			let local_z = - ( rd_y - tileset_offset_y );

			// move target and maintain the relative camera position
			this.controls.target.x = local_x;
			this.controls.target.z = local_z;
			this.camera.position.x = local_x + ox;
			this.camera.position.y = local_y + oy;
			this.camera.position.z = local_z + oz;

			this.controls.update();

			if ( q.placeMarker == "true" ) {

				this.placeMarkerOnPoint( new Vector3( local_x, local_y, local_z ) );

			}

		},
		setRouteFromCameraPos() {

			// compute current camera position relative to target
			let local_x = this.controls.target.x;
			let local_z = this.controls.target.z;
			let tileset_offset_x = this.tiles.root.cached.transform.elements[ 12 ];
			let tileset_offset_y = this.tiles.root.cached.transform.elements[ 13 ];

			// compute RD coordinates
			let RdX = local_x + tileset_offset_x;
			let RdY = ( - local_z ) + tileset_offset_y;

			let cam_offset = {
				x: this.camera.position.x - this.controls.target.x,
				y: this.camera.position.y - this.controls.target.y,
				z: this.camera.position.z - this.controls.target.z };

			// emit camera offset for url generation in the parent app
			this.$emit( 'cam-offset', cam_offset );
			// push values to url, catch errors (ie NavigationDuplicated, when pushin a route that is equal to the current route)
			this.$router.push(
				{ url: '/', query: { rdx: RdX, rdy: RdY, ox: cam_offset.x, oy: cam_offset.y, oz: cam_offset.z } }
			).catch( err => {} );

			// console.log( {rdx: RdX, rdy: RdY, cam_offset: cam_offset} );

		},
		placeMarkerOnPoint( position ) {

			var marker = this.scene.getObjectByName( this.markerName );

			if ( marker != "undefined" ) {

				this.scene.remove( marker );

			}

			var textureLoader = new TextureLoader();
			var map = textureLoader.load( markerSprite );
			var material = new SpriteMaterial( { map: map } );
			var sprite = new Sprite( material );

			// Render sprite on top of other objects & fixed size regardless of zoom
			material.depthWrite = false;
			material.depthTest = false;
			material.sizeAttenuation = false;

			sprite.position.set( position.x, position.y, position.z );
			sprite.scale.set( 0.04, 0.10, 1 );
			sprite.name = this.markerName;

			this.scene.add( sprite );

		},
		setTileAttributes( s, c ) {

			const batch_ids = c.geometry.getAttribute( '_batchid' );
			const attrs = s.batchTable.getData( 'attributes' );
			const new_attr_buffer = new Float32Array( batch_ids.count );
			for ( let i = 0; i < batch_ids.count; i ++ ) {

				const bid = batch_ids.getX( i );
				new_attr_buffer[ i ] = JSON.parse( attrs[ bid ] )[ this.colorAttrName ];

			}
			c.geometry.setAttribute( "attrValue", new Float32BufferAttribute( new_attr_buffer, 1 ) );

		},
		reinitTiles() {

			if ( this.tiles ) {

				this.offsetParent.remove( this.tiles.group );

			}

			this.tiles = new TilesRenderer( this.tilesUrl );
			this.tiles.lruCache.minSize = this.lruCacheMinSize;
			this.tiles.lruCache.maxSize = this.lruCacheMaxSize;

			this.tiles.errorTarget = this.errorTarget;
			this.tiles.errorThreshold = this.errorThreshold;
			this.tiles.loadSiblings = false;
			this.tiles.maxDepth = 15;
			this.tiles.showEmptyTiles = true;

			this.tiles.downloadQueue.priorityCallback = tile => 1 / tile.cached.distance;

			this.tiles.setCamera( this.dummyCamera );
			this.tiles.setResolutionFromRenderer( this.dummyCamera, this.renderer );

			this.tiles.onLoadTileSet = () => {

				// Ensure the tileset is loaded prior to setting the position form the url parameters (we need the tileset transform to do that)
				let q = this.$router.currentRoute.query;
				if ( "rdx" in q && "rdy" in q && "ox" in q && "oy" in q && "oz" in q ) {

					this.setCameraPosFromRoute( q );

				} else {

					// default viewport
					this.setCameraPosFromRoute( {
						rdx: "85181.55571255696",
						rdy: "446859.38171179296",
						ox: "-223.36609616703936",
						oy: "281.19798302772574",
						oz: "-184.218705413541"
					} );

				}

				this.needsRerender = 2;

			};
			this.tiles.onLoadModel = ( s ) => {

				const offset_z = this.tiles.root.cached.transform.elements[ 14 ];
				s.traverse( c => {

					if ( c.material ) {

						c.material.dispose();
						c.material = this.material;

						if ( c.geometry ) {

							c.geometry.computeBoundingBox();
							c.position.y = offset_z;

						}

						if ( this.enableAttributeColoring ) {

							this.setTileAttributes( s, c );

						}

					}

				} );

				this.needsRerender = 1;

			};

			this.offsetParent.add( this.tiles.group );

		},
		reinitBasemap() {

			if ( this.terrainTiles ) {

				this.offsetParent.remove( this.terrainTiles.group );

			}

			if ( this.basemapOptions.type == "wms" ) {

				this.terrainTiles = new WMSTilesRenderer(
					this.basemapOptions.options.url,
					this.basemapOptions.options.layer,
					this.basemapOptions.options.style
				);

				// this.terrainTiles.imageFormat = this.basemapOptions.imageFormat;

			} else {

				this.terrainTiles = new WMTSTilesRenderer( this.basemapOptions.options, () => this.needsRerender = 1 );

			}

			this.offsetParent.add( this.terrainTiles.group );

			this.terrainTiles.onLoadTile = () => this.needsRerender = 1;

		},
		initScene() {

			this.scene = new Scene();
			this.scene.background = new Color( this.fogColor );
			this.fog = new FogExp2( this.fogColor, this.fogDensity );

			this.material = new ShaderMaterial( this.batchIdHighlightShaderMixin( ShaderLib.lambert ) );
			this.material.uniforms.diffuse.value = new Color( this.meshColor ).convertSRGBToLinear();

			this.highlightMaterial = new ShaderMaterial( this.batchIdHighlightShaderMixin( ShaderLib.lambert ) );
			this.highlightMaterial.uniforms.diffuse.value = new Color( this.meshColor ).convertSRGBToLinear();

			let canvas = document.getElementById( "canvas" );

			this.renderer = new WebGLRenderer( { antialias: false } );
			this.renderer.setPixelRatio( window.devicePixelRatio );
			this.renderer.setSize( canvas.clientWidth, canvas.clientHeight );
			this.renderer.setClearColor( 0xd9eefc );
			this.renderer.outputEncoding = sRGBEncoding;

			canvas.appendChild( this.renderer.domElement );

			this.camera = new PerspectiveCamera( 50, canvas.clientWidth / canvas.clientHeight, this.nearPlane, this.farPlane );
			this.camera.position.set( 400, 400, 400 );

			this.dummyCamera = new PerspectiveCamera( 30, canvas.clientWidth / canvas.clientHeight, this.nearPlane, this.dummyFarPlane );

			this.offsetParent = new Group();
			this.scene.add( this.offsetParent );

			this.box = new Box3();

			this.raycaster = new Raycaster();

			this.mouse = new Vector2();

			this.reinitTiles();

			this.controls = new OrbitControls( this.camera, this.renderer.domElement );
			this.controls.screenSpacePanning = false;
			this.controls.enableDamping = true;
			this.controls.dampingFactor = 0.15;
			this.controls.minDistance = 20;
			this.controls.maxDistance = 2500;
			this.controls.maxPolarAngle = 0.8;
			this.controls.mouseButtons = {
				LEFT: MOUSE.PAN,
				MIDDLE: MOUSE.DOLLY,
				RIGHT: MOUSE.ROTATE
			};
			this.controls.touches = {
				ONE: TOUCH.ROTATE,
				TWO: TOUCH.DOLLY_PAN
			};
			this.controls.addEventListener( "change", () => this.needsRerender = 1 );
			this.controls.addEventListener( "end", this.setRouteFromCameraPos );

			this.renderer.domElement.addEventListener( 'pointermove', this.onPointerMove, false );
			this.renderer.domElement.addEventListener( 'pointerdown', this.onPointerDown, false );
			this.renderer.domElement.addEventListener( 'pointerup', this.onPointerUp, false );
			this.renderer.domElement.addEventListener( 'pointerleave', this.onPointerLeave, false );

			this.composer = new EffectComposer( this.renderer );
			var ssaoPass = new SSAOPass( this.scene, this.camera, canvas.cliendWidth, canvas.clientHeight );
			ssaoPass.kernelRadius = 16;
			this.composer.addPass( ssaoPass );

			// lights
			this.pLight = new PointLight( 0xffffff, this.pointIntensity, 0, 1 );
			this.camera.add( this.pLight );
			this.scene.add( this.camera );

			this.dirLight = new DirectionalLight( 0xffffff, this.directionalIntensity );
			this.dirLight.position.set( this.dirX, this.dirY, this.dirZ );
			this.scene.add( this.dirLight );

			this.ambLight = new AmbientLight( 0xffffff, this.ambientIntensity );
			this.scene.add( this.ambLight );

			//this.hemLight = new HemisphereLight( 0xffffbb, 0x080820, 1 );
			//this.scene.add(this.hemLight);

			this.offsetParent.rotation.x = - Math.PI / 2;

			// this.reinitWms();

			this.reinitBasemap();

			this.needsRerender = 1;
			this.renderScene();

			window.addEventListener( 'resize', this.onWindowResize, false );

		},
		onWindowResize() {

			let canvas = document.getElementById( "canvas" );
			this.camera.aspect = canvas.clientWidth / canvas.clientHeight;
			this.renderer.setSize( canvas.clientWidth, canvas.clientHeight );

			this.camera.updateProjectionMatrix();
			this.renderer.setPixelRatio( window.devicePixelRatio );

			this.needsRerender = 1;

		},
		onPointerMove( evt ) {

			if ( this.castOnHover ) {

				this.castRay( evt.clientX, evt.clientY );

			}

		},
		onPointerDown( evt ) {

			this.pointerCaster.startClientX = evt.clientX;
			this.pointerCaster.startClientY = evt.clientY;

		},
		onPointerUp( evt ) {

			if (
				this.pointerCaster.startClientX == evt.clientX &&
				this.pointerCaster.startClientY == evt.clientY
			) {

				this.castRay( evt.clientX, evt.clientY );

			}

		},
		castRay( clientX, clientY ) {

			const rect = this.renderer.domElement.getBoundingClientRect();
			this.mouse.x = ( ( clientX - rect.left ) / this.renderer.domElement.clientWidth ) * 2 - 1;
			this.mouse.y = - ( ( clientY - rect.top ) / this.renderer.domElement.clientHeight ) * 2 + 1;

			this.raycaster.setFromCamera( this.mouse, this.camera );

			// check if we are hitting the geocoding marker. Eearly return if that was the case.
			var marker = this.scene.getObjectByName( this.markerName );

			if ( marker != undefined ) {

				const results = this.raycaster.intersectObject( marker, true );

				if ( results.length && results[ 0 ].uv.y >= 0.5 ) {

					this.scene.remove( marker );
					this.needsRerender = 1;
					return;

				}

			}

			// check if we are hitting a building
			const results = this.raycaster.intersectObject( this.tiles.group, true );

			// Set up the highlighted batchid to the material of new object
			if ( this.selectedObject ) {

				this.selectedObject.material = this.material;
				this.selectedObject = undefined;

			}

			if ( results.length ) {

				const { face, object } = results[ 0 ];

				// Get info from batchTable
				const batch_id_table = object.geometry.getAttribute( '_batchid' );
				const batch_id = batch_id_table.getX( face.a );

				const batchTable = object.parent.batchTable;
				const keys = batchTable.getKeys();

				if ( keys.includes( "attributes" ) ) {

					const attributes = JSON.parse( batchTable.getData( "attributes" )[ batch_id ] );
					// eslint-disable-next-line no-console
					// console.log( attributes );
					this.$emit( 'object-picked', { "batchID": batch_id, "attributes": attributes } );

				}

				object.material = this.highlightMaterial;
				this.highlightMaterial.uniforms.highlightedBatchId.value = batch_id;
				this.selectedObject = object;

			} else {

				this.$emit( 'object-picked', undefined );

			}

			this.needsRerender = 1;

		},
		updateTerrain: function () {

			const transform = this.tiles.root.cached.transform;
			const sceneTransform = new Vector2( transform.elements[ 12 ], transform.elements[ 13 ] );

			this.terrainTiles.update( sceneTransform, this.camera );

		},
		renderScene() {

			requestAnimationFrame( this.renderScene );

			if ( this.needsRerender > 0 ) {

				this.needsRerender --;

				// update tiles center
				if ( this.tiles.getBounds( this.box ) ) {

					this.box.getCenter( this.tiles.group.position );
					this.tiles.group.position.multiplyScalar( - 1 );

				}

				this.controls.update();
				this.camera.updateMatrixWorld();

				this.dummyCamera.matrixWorld.copy( this.camera.matrixWorld );
				this.dummyCamera.position.copy( this.camera.position );
				this.dummyCamera.quaternion.copy( this.camera.quaternion );
				this.dummyCamera.scale.copy( this.camera.scale );
				this.dummyCamera.far = this.dummyFarPlane;
				this.dummyCamera.updateMatrixWorld();

				this.lruCacheSize = this.tiles.lruCache.itemSet.size;
				this.tiles.update();

				if ( this.tiles.root ) {

					this.updateTerrain();

				}

				if ( this.meshShading == "normal" ) {

					this.renderer.render( this.scene, this.camera );

				} else if ( this.meshShading == "ssao" ) {

					this.composer.render();

				}

			}

		},
	}
};
</script>

<style scoped>
#canvas {
  width: 100%;
  height: 100%;
}
</style>
