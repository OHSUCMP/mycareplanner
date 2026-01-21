export interface RxClassSummary {
    RxCui: string,
    ClassId: string,
    ClassName: string
}

export class MedicationFlag {
    label: string;
    rxClassList: string[];
    backgroundColor: string;
    textColor: string;

    constructor(label: string, rxClassList: string[], backgroundColor: string, textColor: string) {
        this.label = label;
        this.rxClassList = rxClassList;
        this.backgroundColor = backgroundColor;
        this.textColor = textColor;
    }
}
