import preensambleImg from '@assets/materials/preensamble.png';
import cduImg from '@assets/materials/cdu.png';
import electronicsImg from '@assets/materials/electronics.png';
import insinkeratorImg from '@assets/materials/insinkerator.png';
import ecmfanImg from '@assets/materials/ecmfan.png';
import thermoImg from '@assets/materials/thermo_v2.png';
//?Rotores se dejan on hold por el momento
// import rotoriseImg from '@assets/materials/rotorise.png';
// import rotorwetImg from '@assets/materials/rotorwet.png';

/**
 * Configuración base local. 
 * El Nombre, Supervisores y Líderes ahora se recuperan dinámicamente de la BD 
 * mediante el servicio productionService.getLinesConfig(id).
 */
export const LINES_CONFIG = {
    cdu: {
        id: "cdu",
        name: "CDU",
        defaultMeta: 24,
        imgURL: cduImg
    },
    thermo: {
        id: "thermo",
        name: "THERMOFISHER",
        defaultMeta: 3,
        imgURL: thermoImg
    },
    electronics: {
        id: "electronics",
        name: "ELECTRONICS",
        defaultMeta: 180,
        imgURL: electronicsImg
    },
    ecmfan: {
        id: "ecmfan",
        name: "ECM FAN",
        defaultMeta: 60,
        imgURL: ecmfanImg
    },
    insinkerator1:{
        id: "insinkerator1",
        name: "INSINKERATOR L1",
        defaultMeta: 140,
        imgURL: insinkeratorImg
    },
    insinkerator2:{
        id: "insinkerator2",
        name: "INSINKERATOR L2",
        defaultMeta: 140,
        imgURL: insinkeratorImg
    },
    preensamble: {
        id: "preensamble",
        name: "PRE-ENSAMBLE",
        defaultMeta: 350,
        imgURL: preensambleImg
    }
};
