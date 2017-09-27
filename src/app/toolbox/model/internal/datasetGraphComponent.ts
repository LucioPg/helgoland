import {
    DoCheck,
    EventEmitter,
    Input,
    IterableDiffer,
    IterableDiffers,
    OnChanges,
    Output,
    SimpleChanges,
} from '@angular/core';

import { ApiInterface } from './../../services/api-interface/api-interface.service';
import { InternalIdHandler } from './../../services/api-interface/internal-id-handler.service';
import { Time } from './../../services/time/time.service';
import { DatasetOptions } from './../api/dataset/options';
import { ResizableComponent } from './ResizableComponent';
import { TimeInterval, Timespan } from './time-interval';

const equal = require('deep-equal');

export abstract class DatasetGraphComponent extends ResizableComponent implements OnChanges, DoCheck {

    @Input()
    public datasetIds: Array<string>;
    private datasetIdsDiffer: IterableDiffer<string>;

    @Input()
    public selectedDatasetIds: Array<string>;
    private selectedDatasetIdsDiffer: IterableDiffer<string>;

    @Input()
    public timeInterval: TimeInterval;

    @Input()
    public datasetOptions: Map<string, DatasetOptions>;
    public oldDatasetOptions: Map<string, DatasetOptions> = new Map();

    @Input()
    public graphOptions: any;
    private oldGraphOptions: any;

    @Output()
    public onDatasetSelected: EventEmitter<Array<string>> = new EventEmitter();

    @Output()
    public onTimespanChanged: EventEmitter<Timespan> = new EventEmitter();

    @Output()
    public onMessageThrown: EventEmitter<GraphMessage> = new EventEmitter();

    protected timespan: Timespan;

    constructor(
        protected iterableDiffers: IterableDiffers,
        protected api: ApiInterface,
        protected datasetIdResolver: InternalIdHandler,
        protected timeSrvc: Time
    ) {
        super();
        this.datasetIdsDiffer = this.iterableDiffers.find([]).create();
        this.selectedDatasetIdsDiffer = this.iterableDiffers.find([]).create();
    }

    public ngOnChanges(changes: SimpleChanges): void {
        if (changes.timeInterval) {
            this.timespan = this.timeSrvc.createTimespanOfInterval(this.timeInterval);
            this.loadDatasetData();
        }
    }

    public ngDoCheck(): void {
        const datasetIdsChanges = this.datasetIdsDiffer.diff(this.datasetIds);
        if (datasetIdsChanges) {
            datasetIdsChanges.forEachAddedItem(addedItem => {
                const internalId = this.datasetIdResolver.resolveInternalId(addedItem.item);
                this.addDataset(internalId.id, internalId.url);
            });
            datasetIdsChanges.forEachRemovedItem(removedItem => {
                this.removeDataset(removedItem.item);
            });
        }

        const selectedDatasetIdsChanges = this.selectedDatasetIdsDiffer.diff(this.selectedDatasetIds);
        if (selectedDatasetIdsChanges) {
            selectedDatasetIdsChanges.forEachAddedItem(addedItem => {
                this.setSelectedId(addedItem.item);
            });
            selectedDatasetIdsChanges.forEachRemovedItem(removedItem => {
                this.removeSelectedId(removedItem.item);
            });
        }

        if (!equal(this.oldGraphOptions, this.graphOptions)) {
            this.oldGraphOptions = JSON.parse(JSON.stringify(this.graphOptions));
            const options = JSON.parse(JSON.stringify(this.graphOptions));
            this.optionsChanged(options);
        }

        this.datasetOptions.forEach((value, key) => {
            if (!equal(value, this.oldDatasetOptions.get(key))) {
                this.oldDatasetOptions.set(key, JSON.parse(JSON.stringify(this.datasetOptions.get(key))));
                this.datasetOptionsChanged(key, value);
            }
        });
    }

    protected abstract loadDatasetData(): void;

    protected abstract addDataset(internalId: string, url: string): void;

    protected abstract removeDataset(internalId: string): void;

    protected abstract setSelectedId(internalId: string): void;

    protected abstract removeSelectedId(internalId: string): void;

    protected abstract optionsChanged(options: any): void;

    protected abstract datasetOptionsChanged(internalId: string, options: DatasetOptions): void;

}

export interface GraphMessage {
    type: GraphMessageType;
    message: string;
}

export enum GraphMessageType {
    ERROR,
    INFO
}
