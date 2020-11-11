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
import throttle from 'lodash/throttle';
// Image from https://uxwing.com/maps-pin-black-icon/
import markerSprite from '@/assets/locationmarker.png';

const cm_hot = [
	new Color( 0.2298057, 0.298717966, 0.753683153 ),
	new Color( 0.23437707945098038, 0.3055417303294118, 0.7596795275882353 ),
	new Color( 0.2389484589019608, 0.3123654946588235, 0.7656759021764705 ),
	new Color( 0.24351983835294116, 0.3191892589882353, 0.7716722767647058 ),
	new Color( 0.24809121780392157, 0.3260130233176471, 0.7776686513529412 ),
	new Color( 0.2526625972549019, 0.3328367876470588, 0.7836650259411765 ),
	new Color( 0.25723397670588233, 0.3396605519764706, 0.7896614005294117 ),
	new Color( 0.26180535615686273, 0.3464843163058824, 0.795657775117647 ),
	new Color( 0.26638146835294113, 0.35330440842352945, 0.8016373194980392 ),
	new Color( 0.2711042956470588, 0.3600106619764706, 0.8070951274352941 ),
	new Color( 0.27582712294117645, 0.36671691552941177, 0.812552935372549 ),
	new Color( 0.2805499502352941, 0.37342316908235296, 0.818010743309804 ),
	new Color( 0.28527277752941177, 0.38012942263529415, 0.8234685512470589 ),
	new Color( 0.2899956048235294, 0.3868356761882353, 0.8289263591843137 ),
	new Color( 0.29471843211764703, 0.39354192974117647, 0.8343841671215686 ),
	new Color( 0.2994412594117647, 0.40024818329411765, 0.8398419750588235 ),
	new Color( 0.3041742870039216, 0.40694488283921565, 0.8452627266980393 ),
	new Color( 0.30906031906666664, 0.41349827226666663, 0.8501276338666667 ),
	new Color( 0.31394635112941177, 0.4200516616941176, 0.8549925410352941 ),
	new Color( 0.31883238319215684, 0.4266050511215686, 0.8598574482039216 ),
	new Color( 0.32371841525490197, 0.4331584405490196, 0.864722355372549 ),
	new Color( 0.32860444731764704, 0.43971182997647057, 0.8695872625411765 ),
	new Color( 0.33349047938039217, 0.44626521940392155, 0.8744521697098039 ),
	new Color( 0.3383765114431373, 0.45281860883137254, 0.8793170768784313 ),
	new Color( 0.34327752343529416, 0.45935363472941176, 0.8841219216235294 ),
	new Color( 0.34832334141176474, 0.4657111465098039, 0.8883461629411764 ),
	new Color( 0.3533691593882353, 0.47206865829019606, 0.8925704042588235 ),
	new Color( 0.3584149773647059, 0.47842617007058824, 0.8967946455764706 ),
	new Color( 0.3634607953411765, 0.4847836818509804, 0.9010188868941177 ),
	new Color( 0.36850661331764706, 0.49114119363137254, 0.9052431282117647 ),
	new Color( 0.37355243129411764, 0.4974987054117647, 0.9094673695294118 ),
	new Color( 0.3785982492705882, 0.5038562171921569, 0.9136916108470589 ),
	new Color( 0.383662065772549, 0.5101834172862746, 0.9178306732313726 ),
	new Color( 0.38885187195294113, 0.5162984355764706, 0.9213734830823529 ),
	new Color( 0.3940416781333333, 0.5224134538666667, 0.9249162929333333 ),
	new Color( 0.39923148431372546, 0.5285284721568628, 0.9284591027843138 ),
	new Color( 0.4044212904941176, 0.5346434904470588, 0.9320019126352941 ),
	new Color( 0.4096110966745098, 0.540758508737255, 0.9355447224862745 ),
	new Color( 0.41480090285490195, 0.5468735270274511, 0.939087532337255 ),
	new Color( 0.4199907090352941, 0.5529885453176471, 0.9426303421882353 ),
	new Color( 0.42519897019607844, 0.559058179764706, 0.9460614570784314 ),
	new Color( 0.4305068882509804, 0.5648827414588236, 0.9488894191803922 ),
	new Color( 0.4358148063058824, 0.5707073031529412, 0.951717381282353 ),
	new Color( 0.4411227243607843, 0.5765318648470589, 0.9545453433843137 ),
	new Color( 0.4464306424156863, 0.5823564265411765, 0.9573733054862745 ),
	new Color( 0.4517385604705882, 0.5881809882352941, 0.9602012675882352 ),
	new Color( 0.4570464785254902, 0.5940055499294118, 0.963029229690196 ),
	new Color( 0.4623543965803922, 0.5998301116235294, 0.9658571917921568 ),
	new Color( 0.46767809468235294, 0.6055912316235293, 0.9685462810941176 ),
	new Color( 0.4730701729882353, 0.6110774376156862, 0.970633588262745 ),
	new Color( 0.4784622512941176, 0.6165636436078431, 0.9727208954313725 ),
	new Color( 0.48385432959999997, 0.6220498496, 0.9748082026 ),
	new Color( 0.48924640790588236, 0.6275360555921569, 0.9768955097686275 ),
	new Color( 0.49463848621176465, 0.6330222615843136, 0.9789828169372549 ),
	new Color( 0.500030564517647, 0.6385084675764706, 0.9810701241058823 ),
	new Color( 0.5054226428235293, 0.6439946735686275, 0.9831574312745098 ),
	new Color( 0.5108243242509803, 0.6493966148235294, 0.9850787763764707 ),
	new Color( 0.5162603025411764, 0.6544976105882353, 0.9864073998117647 ),
	new Color( 0.5216962808313725, 0.6595986063529412, 0.9877360232470589 ),
	new Color( 0.5271322591215686, 0.664699602117647, 0.9890646466823529 ),
	new Color( 0.5325682374117646, 0.6698005978823529, 0.9903932701176471 ),
	new Color( 0.5380042157019607, 0.6749015936470587, 0.9917218935529412 ),
	new Color( 0.5434401939921568, 0.6800025894117647, 0.9930505169882353 ),
	new Color( 0.5488761722823529, 0.6851035851764705, 0.9943791404235295 ),
	new Color( 0.5543118699137254, 0.6900970112156862, 0.9955155482352941 ),
	new Color( 0.5597467255686274, 0.6947677280784313, 0.9960753091764706 ),
	new Color( 0.5651815812235294, 0.6994384449411764, 0.9966350701176471 ),
	new Color( 0.5706164368784313, 0.7041091618039216, 0.9971948310588236 ),
	new Color( 0.5760512925333333, 0.7087798786666667, 0.997754592 ),
	new Color( 0.5814861481882353, 0.7134505955294117, 0.9983143529411764 ),
	new Color( 0.5869210038431373, 0.7181213123921568, 0.9988741138823529 ),
	new Color( 0.5923558594980393, 0.7227920292549019, 0.9994338748235294 ),
	new Color( 0.5977767754941177, 0.7273297248823529, 0.9997767317764705 ),
	new Color( 0.603162067917647, 0.7315274773529412, 0.9995652785372549 ),
	new Color( 0.6085473603411764, 0.7357252298235294, 0.9993538252980392 ),
	new Color( 0.6139326527647059, 0.7399229822941177, 0.9991423720588235 ),
	new Color( 0.6193179451882354, 0.7441207347647059, 0.9989309188196078 ),
	new Color( 0.6247032376117647, 0.7483184872352941, 0.9987194655803922 ),
	new Color( 0.6300885300352941, 0.7525162397058823, 0.9985080123411765 ),
	new Color( 0.6354738224588236, 0.7567139921764706, 0.9982965591019608 ),
	new Color( 0.640827782372549, 0.7607515064117647, 0.9978457748823529 ),
	new Color( 0.6461128107647058, 0.7644364965294117, 0.9968684625058823 ),
	new Color( 0.6513978391568627, 0.7681214866470587, 0.9958911501294118 ),
	new Color( 0.6566828675490196, 0.7718064767647058, 0.9949138377529412 ),
	new Color( 0.6619678959411764, 0.7754914668823529, 0.9939365253764706 ),
	new Color( 0.6672529243333334, 0.7791764569999999, 0.992959213 ),
	new Color( 0.6725379527254902, 0.782861447117647, 0.9919819006235294 ),
	new Color( 0.677822981117647, 0.786546437235294, 0.9910045882470588 ),
	new Color( 0.6830556815607843, 0.790042626890196, 0.9897684281843138 ),
	new Color( 0.6881884831921569, 0.7931783792980391, 0.9880381043568628 ),
	new Color( 0.6933212848235294, 0.7963141317058823, 0.9863077805294118 ),
	new Color( 0.6984540864549019, 0.7994498841137254, 0.9845774567019608 ),
	new Color( 0.7035868880862746, 0.8025856365215686, 0.9828471328745098 ),
	new Color( 0.7087196897176471, 0.8057213889294117, 0.9811168090470588 ),
	new Color( 0.7138524913490196, 0.8088571413372548, 0.9793864852196078 ),
	new Color( 0.7189852929803922, 0.811992893745098, 0.9776561613921568 ),
	new Color( 0.724041371882353, 0.8149103926470588, 0.9756509706470589 ),
	new Color( 0.7289695795686274, 0.8174641357058824, 0.973187668372549 ),
	new Color( 0.7338977872549018, 0.8200178787647059, 0.9707243660980392 ),
	new Color( 0.7388259949411764, 0.8225716218235294, 0.9682610638235294 ),
	new Color( 0.743754202627451, 0.8251253648823529, 0.9657977615490196 ),
	new Color( 0.7486824103137254, 0.8276791079411765, 0.9633344592745098 ),
	new Color( 0.753610618, 0.830232851, 0.960871157 ),
	new Color( 0.7585388256862745, 0.8327865940588235, 0.9584078547254902 ),
	new Color( 0.7633627801019607, 0.8350922218196078, 0.9556576765568627 ),
	new Color( 0.7680343643529411, 0.8370352195294117, 0.9524882182352941 ),
	new Color( 0.7727059486039215, 0.8389782172392156, 0.9493187599137255 ),
	new Color( 0.777377532854902, 0.8409212149490196, 0.9461493015921568 ),
	new Color( 0.7820491171058823, 0.8428642126588235, 0.9429798432705883 ),
	new Color( 0.7867207013568628, 0.8448072103686275, 0.9398103849490196 ),
	new Color( 0.7913922856078431, 0.8467502080784314, 0.9366409266274509 ),
	new Color( 0.7960638698588236, 0.8486932057882353, 0.9334714683058823 ),
	new Color( 0.8006008472941177, 0.8503583215607843, 0.9300075603921568 ),
	new Color( 0.8049647588235295, 0.8516661605568627, 0.9261650744313725 ),
	new Color( 0.8093286703529411, 0.8529739995529412, 0.9223225884705882 ),
	new Color( 0.8136925818823529, 0.8542818385490196, 0.9184801025098039 ),
	new Color( 0.8180564934117647, 0.8555896775450981, 0.9146376165490196 ),
	new Color( 0.8224204049411765, 0.8568975165411765, 0.9107951305882354 ),
	new Color( 0.8267843164705883, 0.8582053555372549, 0.906952644627451 ),
	new Color( 0.831148228, 0.8595131945333333, 0.9031101586666667 ),
	new Color( 0.8353447113529412, 0.8605139972941176, 0.8989704099411765 ),
	new Color( 0.839351442772549, 0.861166825654902, 0.8944937634156863 ),
	new Color( 0.8433581741921568, 0.8618196540156863, 0.8900171168901961 ),
	new Color( 0.8473649056117647, 0.8624724823764706, 0.885540470364706 ),
	new Color( 0.8513716370313725, 0.8631253107372548, 0.8810638238392158 ),
	new Color( 0.8553783684509804, 0.8637781390980391, 0.8765871773137255 ),
	new Color( 0.8593850998705882, 0.8644309674588235, 0.8721105307882353 ),
	new Color( 0.863391831290196, 0.8650837958196078, 0.8676338842627451 ),
	new Color( 0.8674276350862745, 0.864376599772549, 0.8626024620196079 ),
	new Color( 0.8714925112588235, 0.8623093793176471, 0.8570162640588236 ),
	new Color( 0.8755573874313726, 0.860242158862745, 0.8514300660980393 ),
	new Color( 0.8796222636039216, 0.8581749384078431, 0.845843868137255 ),
	new Color( 0.8836871397764705, 0.8561077179529412, 0.8402576701764708 ),
	new Color( 0.8877520159490196, 0.8540404974980391, 0.8346714722156863 ),
	new Color( 0.8918168921215687, 0.8519732770431372, 0.829085274254902 ),
	new Color( 0.8958817682941177, 0.8499060565882353, 0.8234990762941177 ),
	new Color( 0.8995432066000001, 0.8475002359999999, 0.8177890744 ),
	new Color( 0.9028486703176472, 0.8447956505882352, 0.8119698337411765 ),
	new Color( 0.9061541340352941, 0.8420910651764706, 0.8061505930823529 ),
	new Color( 0.9094595977529412, 0.8393864797647058, 0.8003313524235294 ),
	new Color( 0.9127650614705882, 0.8366818943529412, 0.7945121117647058 ),
	new Color( 0.9160705251882353, 0.8339773089411765, 0.7886928711058824 ),
	new Color( 0.9193759889058823, 0.8312727235294118, 0.7828736304470588 ),
	new Color( 0.9226814526235294, 0.8285681381176471, 0.7770543897882353 ),
	new Color( 0.925563423, 0.8255172980705883, 0.7711363078117647 ),
	new Color( 0.9281160096666666, 0.8221971488627451, 0.765141349254902 ),
	new Color( 0.9306685963333333, 0.818876999654902, 0.7591463906980392 ),
	new Color( 0.933221183, 0.8155568504470588, 0.7531514321411764 ),
	new Color( 0.9357737696666666, 0.8122367012392158, 0.7471564735843139 ),
	new Color( 0.9383263563333333, 0.8089165520313726, 0.741161515027451 ),
	new Color( 0.940878943, 0.8055964028235294, 0.7351665564705883 ),
	new Color( 0.9434315296666667, 0.8022762536156862, 0.7291715979137255 ),
	new Color( 0.945540298909804, 0.7986057405333333, 0.7231054172980392 ),
	new Color( 0.9473454036, 0.7946955048, 0.7169905058 ),
	new Color( 0.9491505082901961, 0.7907852690666667, 0.7108755943019608 ),
	new Color( 0.9509556129803922, 0.7868750333333333, 0.7047606828039216 ),
	new Color( 0.9527607176705882, 0.7829647976, 0.6986457713058823 ),
	new Color( 0.9545658223607844, 0.7790545618666667, 0.6925308598078431 ),
	new Color( 0.9563709270509804, 0.7751443261333334, 0.6864159483098039 ),
	new Color( 0.9581760317411765, 0.7712340904, 0.6803010368117647 ),
	new Color( 0.9595176584705882, 0.7669728545098039, 0.6741447150392157 ),
	new Color( 0.9605811984235294, 0.7625010185254902, 0.6679635471019607 ),
	new Color( 0.9616447383764706, 0.7580291825411765, 0.6617823791647058 ),
	new Color( 0.9627082783294117, 0.7535573465568628, 0.655601211227451 ),
	new Color( 0.9637718182823529, 0.7490855105725491, 0.6494200432901962 ),
	new Color( 0.9648353582352941, 0.7446136745882352, 0.6432388753529412 ),
	new Color( 0.9658988981882353, 0.7401418386039216, 0.6370577074156862 ),
	new Color( 0.9669624381411764, 0.7356700026196078, 0.6308765394784314 ),
	new Color( 0.9675442976352941, 0.7308497161882352, 0.6246854782352941 ),
	new Color( 0.9678738483176471, 0.7258469080941177, 0.6184892347843137 ),
	new Color( 0.968203399, 0.7208441, 0.6122929913333334 ),
	new Color( 0.9685329496823529, 0.7158412919058823, 0.6060967478823529 ),
	new Color( 0.9688625003647059, 0.7108384838117647, 0.5999005044313725 ),
	new Color( 0.9691920510470589, 0.705835675717647, 0.5937042609803921 ),
	new Color( 0.9695216017294117, 0.7008328676235294, 0.5875080175294117 ),
	new Color( 0.9698511524117647, 0.6958300595294117, 0.5813117740784314 ),
	new Color( 0.9696829796666666, 0.6904839307372549, 0.5751383613647059 ),
	new Color( 0.9692885689999999, 0.6849817470823529, 0.5689753262588235 ),
	new Color( 0.9688941583333334, 0.679479563427451, 0.5628122911529412 ),
	new Color( 0.9684997476666667, 0.673977379772549, 0.5566492560470588 ),
	new Color( 0.968105337, 0.6684751961176472, 0.5504862209411766 ),
	new Color( 0.9677109263333333, 0.6629730124627451, 0.5443231858352942 ),
	new Color( 0.9673165156666667, 0.6574708288078431, 0.5381601507294118 ),
	new Color( 0.966922105, 0.6519686451529412, 0.5319971156235295 ),
	new Color( 0.9660167198392157, 0.6461297415882352, 0.5258903482588235 ),
	new Color( 0.9649113881372549, 0.6401590780588234, 0.5198055987058824 ),
	new Color( 0.963806056435294, 0.6341884145294118, 0.5137208491529413 ),
	new Color( 0.9627007247333333, 0.628217751, 0.5076360996 ),
	new Color( 0.9615953930313725, 0.6222470874705882, 0.5015513500470589 ),
	new Color( 0.9604900613294117, 0.6162764239411764, 0.49546660049411767 ),
	new Color( 0.9593847296274509, 0.6103057604117648, 0.4893818509411765 ),
	new Color( 0.9582793979254902, 0.604335096882353, 0.48329710138823534 ),
	new Color( 0.9566532109764706, 0.598033822717647, 0.4773022923529412 ),
	new Color( 0.9548534056117647, 0.5916223450078432, 0.4713374634901961 ),
	new Color( 0.9530536002470588, 0.5852108672980392, 0.465372634627451 ),
	new Color( 0.951253794882353, 0.5787993895882353, 0.4594078057647059 ),
	new Color( 0.9494539895176471, 0.5723879118784315, 0.453442976901961 ),
	new Color( 0.9476541841529411, 0.5659764341686274, 0.4474781480392157 ),
	new Color( 0.9458543787882353, 0.5595649564588235, 0.44151331917647063 ),
	new Color( 0.9440545734235294, 0.5531534787490197, 0.4355484903137255 ),
	new Color( 0.9417279298235294, 0.5464134770196079, 0.429707070372549 ),
	new Color( 0.9392537715176471, 0.5395814885647059, 0.4239002049294118 ),
	new Color( 0.9367796132117647, 0.5327495001098039, 0.41809333948627453 ),
	new Color( 0.9343054549058823, 0.525917511654902, 0.4122864740431373 ),
	new Color( 0.9318312966, 0.5190855232, 0.4064796086 ),
	new Color( 0.9293571382941177, 0.512253534745098, 0.40067274315686274 ),
	new Color( 0.9268829799882353, 0.5054215462901961, 0.3948658777137255 ),
	new Color( 0.9244088216823529, 0.49858955783529413, 0.38905901227058826 ),
	new Color( 0.921406221227451, 0.49142041718431373, 0.38340843537647057 ),
	new Color( 0.9182816725843137, 0.48417347218039214, 0.37779392507058823 ),
	new Color( 0.9151571239411764, 0.4769265271764706, 0.3721794147647059 ),
	new Color( 0.9120325752980393, 0.469679582172549, 0.36656490445882356 ),
	new Color( 0.908908026654902, 0.46243263716862765, 0.36095039415294133 ),
	new Color( 0.9057834780117647, 0.4551856921647059, 0.35533588384705883 ),
	new Color( 0.9026589293686275, 0.4479387471607843, 0.3497213735411765 ),
	new Color( 0.8995343807254902, 0.4406918021568627, 0.34410686323529416 ),
	new Color( 0.8958845948352941, 0.43307455670588235, 0.3386806345176471 ),
	new Color( 0.8921375427882353, 0.4253887370980392, 0.33328927276078435 ),
	new Color( 0.8883904907411765, 0.41770291749019606, 0.32789791100392157 ),
	new Color( 0.8846434386941177, 0.41001709788235297, 0.32250654924705885 ),
	new Color( 0.8808963866470588, 0.4023312782745098, 0.3171151874901961 ),
	new Color( 0.8771493346, 0.39464545866666667, 0.31172382573333335 ),
	new Color( 0.8734022825529412, 0.3869596390588235, 0.3063324639764706 ),
	new Color( 0.8696552305058823, 0.37927381945098043, 0.30094110221960785 ),
	new Color( 0.8653913329372549, 0.3711276720470588, 0.2957689564156863 ),
	new Color( 0.8610536002941176, 0.3629157635294118, 0.2906281271764706 ),
	new Color( 0.8567158676509804, 0.3547038550117647, 0.2854872979372549 ),
	new Color( 0.8523781350078431, 0.34649194649411763, 0.2803464686980392 ),
	new Color( 0.848040402364706, 0.3382800379764708, 0.2752056394588237 ),
	new Color( 0.8437026697215686, 0.3300681294588235, 0.2700648102196078 ),
	new Color( 0.8393649370784314, 0.32185622094117644, 0.26492398098039216 ),
	new Color( 0.8350272044352941, 0.3136443124235294, 0.25978315174117644 ),
	new Color( 0.8301865219490197, 0.30473276355294115, 0.25489142806666665 ),
	new Color( 0.8252938101686275, 0.2957488380941176, 0.2500254739333333 ),
	new Color( 0.8204010983882353, 0.2867649126352941, 0.2451595198 ),
	new Color( 0.8155083866078432, 0.2777809871764706, 0.24029356566666665 ),
	new Color( 0.810615674827451, 0.26879706171764706, 0.23542761153333333 ),
	new Color( 0.8057229630470588, 0.2598131362588235, 0.2305616574 ),
	new Color( 0.8008302512666666, 0.2508292108, 0.22569570326666666 ),
	new Color( 0.7959375394862745, 0.24184528534117647, 0.22082974913333334 ),
	new Color( 0.7905615319411765, 0.23139699905882352, 0.21624203829411764 ),
	new Color( 0.7851533046784314, 0.2208510887215686, 0.21167287700784312 ),
	new Color( 0.7797450774156863, 0.21030517838431373, 0.20710371572156863 ),
	new Color( 0.7743368501529412, 0.19975926804705882, 0.2025345544352941 ),
	new Color( 0.7689286228901963, 0.18921335770980421, 0.19796539314901973 ),
	new Color( 0.763520395627451, 0.17866744737254903, 0.1933962318627451 ),
	new Color( 0.758112168364706, 0.1681215370352941, 0.18882707057647058 ),
	new Color( 0.7527039411019608, 0.1575756266980392, 0.1842579092901961 ),
	new Color( 0.7468380122117647, 0.14002101948235293, 0.17999609695686275 ),
	new Color( 0.7409573187529412, 0.12224032527058823, 0.17574419910588235 ),
	new Color( 0.7350766252941177, 0.10445963105882351, 0.17149230125490195 ),
	new Color( 0.7291959318352941, 0.08667893684705881, 0.16724040340392157 ),
	new Color( 0.7233152383764706, 0.06889824263529411, 0.16298850555294117 ),
	new Color( 0.717434544917647, 0.05111754842352939, 0.15873660770196077 ),
	new Color( 0.7115538514588235, 0.03333685421176469, 0.1544847098509804 ),
	new Color( 0.705673158, 0.01555616, 0.150232812 )
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
			cm_hot.forEach( ( col, i ) => {

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
						float texCoord = (attrValue - valMin)/(valMax-valMin);
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
			fac.addInput( this, "colorAttrName", { options: { rmse: "_rmse", m2pc_error_max: "_m2pc_error_max", t_run: "_t_run" } } ).on( 'change', ( val ) => {

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

			this.camera = new PerspectiveCamera( 60, canvas.clientWidth / canvas.clientHeight, this.nearPlane, this.farPlane );
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
		updateTerrain: throttle( function () {

			const transform = this.tiles.root.cached.transform;
			const sceneTransform = new Vector2( transform.elements[ 12 ], transform.elements[ 13 ] );

			this.terrainTiles.update( sceneTransform, this.camera );

		}, 200 ),
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
