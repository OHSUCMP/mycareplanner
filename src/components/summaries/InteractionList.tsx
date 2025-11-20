import '../../Home.css';
import React, {FC, useState, useEffect} from 'react';
import {
    FHIRData,
    displayConcept,
    displayTransmitter,
    displayPeriod, displayParticipant, displayDate
} from '../../data-services/models/fhirResources';
import {Encounter, ServiceRequest} from '../../data-services/fhir-types/fhir-r4';
import {Summary, SummaryRowItem, SummaryRowItems} from './Summary';
import {SortModal} from '../sort-modal/sortModal';
import {SortOnlyModal} from '../sort-only-modal/sortOnlyModal';
import {DeterminateProgress} from "../determinate-progress/DeterminateProgress";
import {CircularProgress} from "@mui/material";

interface InteractionListProps {
    sharingData: boolean;
    fhirDataCollection?: FHIRData[];
    progressTitle: string;
    progressValue: number;
    progressMessage: string;
}

export const InteractionList: FC<InteractionListProps> = ({sharingData, fhirDataCollection,
                                                          progressTitle, progressValue, progressMessage}) => {
    process.env.REACT_APP_DEBUG_LOG === "true" && console.log("InteractionList component RENDERED!");

    // Encounters

    const [encounterShowModal, setEncounterShowModal] = useState<boolean>(false);
    const [encounterSortOption, setEncounterSortOption] = useState<string>('');
    const [encounterFilterOption, setEncounterFilterOption] = useState<string[]>([]);
    const [sortedAndFilteredEncounters, setSortedAndFilteredEncounters] = useState<{
        encounter: Encounter,
        provider: string,
        provenance?: string
    }[]>([]);
    const [encounterFilteringOptions, setEncounterFilteringOptions] = useState<{ value: string; label: string }[]>([]);

    useEffect(() => {
        applyEncounterSortingAndFiltering();
    }, [fhirDataCollection, encounterSortOption, encounterFilterOption]);

    useEffect(() => {
        generateEncounterFilteringOptions();
    }, [fhirDataCollection]);

    const encounterCloseModal = () => {
        setEncounterShowModal(false);
    };

    const handleEncounterSortFilterSubmit = (sortOption: string, filterOption?: string[]) => {
        setEncounterSortOption(sortOption);
        if (filterOption) {
            setEncounterFilterOption(filterOption);
        }
        setEncounterShowModal(false);
    };

    const generateEncounterFilteringOptions = () => {
        if (!fhirDataCollection || fhirDataCollection.length === 0) {
            setEncounterFilteringOptions([]);
            return;
        }

        const uniqueServerNames = Array.from(new Set(fhirDataCollection.map(data => data.serverName)));
        const options = uniqueServerNames.map(value => ({
            value: value || '',
            label: value || '',
        }));

        setEncounterFilteringOptions(options);
    };

    const encounterSortingOptions = [
        {value: 'newest', label: 'Date Created: Newest'},
        {value: 'oldest', label: 'Date Created: Oldest'},
    ];

    const applyEncounterSortingAndFiltering = () => {
        if (!fhirDataCollection) return;

        let combinedEncounters: { encounter: Encounter, provider: string, provenance?: string }[] = [];

        fhirDataCollection.forEach((data, providerIndex) => {
            const providerName = data.serverName || 'Unknown';
            (data.encounters || []).forEach(encounter => {
                let provenance = data.provenanceMap?.get("Encounter/" + (encounter.id ?? 'missingId'))?.[0]
                combinedEncounters.push({
                    encounter,
                    provider: providerName,
                    provenance: displayTransmitter(provenance)
                });
            });
        });

        // Apply filtering
        if (encounterFilterOption.length > 0) {
            combinedEncounters = combinedEncounters.filter(({provider}) => encounterFilterOption.includes(provider));
        }

        // Apply sorting
        switch (encounterSortOption) {
            case 'oldest':
                combinedEncounters.sort((a, b) => (a.encounter?.period?.start || '').localeCompare(b.encounter?.period?.start || ''));
                break;
            default:
            case 'newest':
                combinedEncounters.sort((a, b) => (b.encounter?.period?.start || '').localeCompare(a.encounter?.period?.start || ''));
                break;
        }

        setSortedAndFilteredEncounters(combinedEncounters);
    };

    // Service Requests

    const [serviceRequestShowModal, setServiceRequestShowModal] = useState<boolean>(false);
    const [serviceRequestSortOption, setServiceRequestSortOption] = useState<string>('');
    const [serviceRequestFilterOption, setServiceRequestFilterOption] = useState<string[]>([]);
    const [sortedAndFilteredServiceRequests, setSortedAndFilteredServiceRequests] = useState<{
        serviceRequest: ServiceRequest,
        provider: string,
        provenance?: string
    }[]>([]);
    const [serviceRequestFilteringOptions, setServiceRequestFilteringOptions] = useState<{ value: string; label: string }[]>([]);

    useEffect(() => {
        applyServiceRequestSortingAndFiltering();
    }, [fhirDataCollection, serviceRequestSortOption, serviceRequestFilterOption]);

    useEffect(() => {
        generateServiceRequestFilteringOptions();
    }, [fhirDataCollection]);

    const closeServiceRequestModal = () => {
        setServiceRequestShowModal(false);
    };

    const handleServiceRequestSortFilterSubmit = (sortOption: string, filterOption?: string[]) => {
        setServiceRequestSortOption(sortOption);
        if (filterOption) {
            setServiceRequestFilterOption(filterOption);
        }
        setServiceRequestShowModal(false);
    };

    const generateServiceRequestFilteringOptions = () => {
        if (!fhirDataCollection || fhirDataCollection.length === 0) {
            setServiceRequestFilteringOptions([]);
            return;
        }

        const uniqueServerNames = Array.from(new Set(fhirDataCollection.map(data => data.serverName)));
        const options = uniqueServerNames.map(value => ({
            value: value || '',
            label: value || '',
        }));

        setServiceRequestFilteringOptions(options);
    };

    const serviceRequestSortingOptions = [
        {value: 'alphabetical-az', label: 'Alphabetical: A-Z'},
        {value: 'alphabetical-za', label: 'Alphabetical: Z-A'},
        {value: 'newest', label: 'Date Created: Newest'},
        {value: 'oldest', label: 'Date Created: Oldest'},
    ];

    const applyServiceRequestSortingAndFiltering = () => {
        if (!fhirDataCollection) return;

        let combinedServiceRequests: { serviceRequest: ServiceRequest, provider: string, provenance?: string }[] = [];

        fhirDataCollection.forEach((data, providerIndex) => {
            const providerName = data.serverName || 'Unknown';
            (data.serviceRequests || []).forEach(serviceRequest => {
                let provenance = data.provenanceMap?.get("ServiceRequest/" + (serviceRequest.id ?? 'missingId'))?.[0]
                combinedServiceRequests.push({
                    serviceRequest,
                    provider: providerName,
                    provenance: displayTransmitter(provenance)
                });
            });
        });

        // Apply filtering
        if (serviceRequestFilterOption.length > 0) {
            combinedServiceRequests = combinedServiceRequests.filter(({provider}) => serviceRequestFilterOption.includes(provider));
        }

        // Apply sorting
        switch (serviceRequestSortOption) {
            case 'alphabetical-az':
                combinedServiceRequests.sort((a, b) => (a.serviceRequest.code?.text || '').localeCompare(b.serviceRequest.code?.text || ''));
                break;
            case 'alphabetical-za':
                combinedServiceRequests.sort((a, b) => (b.serviceRequest.code?.text || '').localeCompare(a.serviceRequest.code?.text || ''));
                break;
            case 'newest':
                combinedServiceRequests.sort((a, b) => (b.serviceRequest?.authoredOn || '').localeCompare(a.serviceRequest?.authoredOn || ''));
                break;
            case 'oldest':
                combinedServiceRequests.sort((a, b) => (a.serviceRequest?.authoredOn || '').localeCompare(b.serviceRequest?.authoredOn || ''));
                break;
            default:
                break;
        }

        setSortedAndFilteredServiceRequests(combinedServiceRequests);
    };

    return (
        <div className="home-view">
            <div className="welcome">

                {(fhirDataCollection === undefined || sharingData) && (
                    <div>
                        <h6>{progressTitle}</h6>
                        <DeterminateProgress progressValue={progressValue}/>
                        <p>{progressMessage}...<span style={{paddingLeft: '10px'}}><CircularProgress
                            size="1rem"/></span></p>
                    </div>
                )}

                <h4 className="title">Visits</h4>

                {fhirDataCollection && fhirDataCollection.length === 1 ? (
                    <a className="text-right" onClick={() => setEncounterShowModal(true)}>
                        SORT
                    </a>
                ) : (
                    <a className="text-right" onClick={() => setEncounterShowModal(true)}>
                        SORT/FILTER
                    </a>
                )}

                {encounterShowModal && (
                    fhirDataCollection && fhirDataCollection.length === 1 ? (
                        <SortOnlyModal
                            showModal={encounterShowModal}
                            closeModal={encounterCloseModal}
                            onSubmit={handleEncounterSortFilterSubmit}
                            sortingOptions={encounterSortingOptions}
                        />
                    ) : (
                        <SortModal
                            showModal={encounterShowModal}
                            closeModal={encounterCloseModal}
                            onSubmit={handleEncounterSortFilterSubmit}
                            sortingOptions={encounterSortingOptions}
                            filteringOptions={encounterFilteringOptions}
                        />
                    )
                )}

                {sortedAndFilteredEncounters.length === 0 ? (
                    <p>No records found.</p>
                ) : (
                    sortedAndFilteredEncounters.map(({encounter, provider, provenance}, index) => (
                        <Summary key={index} id={index} rows={buildEncounterRows(encounter, provider, provenance)}/>
                    ))
                )}

                <h4 className="title">Upcoming Tests and Procedures</h4>

                {fhirDataCollection && fhirDataCollection.length === 1 ? (
                    <a className="text-right" onClick={() => setServiceRequestShowModal(true)}>
                        SORT
                    </a>
                ) : (
                    <a className="text-right" onClick={() => setServiceRequestShowModal(true)}>
                        SORT/FILTER
                    </a>
                )}

                {serviceRequestShowModal && (
                    fhirDataCollection && fhirDataCollection.length === 1 ? (
                        <SortOnlyModal
                            showModal={serviceRequestShowModal}
                            closeModal={closeServiceRequestModal}
                            onSubmit={handleServiceRequestSortFilterSubmit}
                            sortingOptions={serviceRequestSortingOptions}
                        />
                    ) : (
                        <SortModal
                            showModal={serviceRequestShowModal}
                            closeModal={closeServiceRequestModal}
                            onSubmit={handleServiceRequestSortFilterSubmit}
                            sortingOptions={serviceRequestSortingOptions}
                            filteringOptions={serviceRequestFilteringOptions}
                        />
                    )
                )}

                {sortedAndFilteredServiceRequests.length === 0 ? (
                    <p>No records found.</p>
                ) : (
                    sortedAndFilteredServiceRequests.map(({serviceRequest, provider, provenance}, index) => (
                        <Summary key={index} id={index} rows={buildServiceRequestRows(serviceRequest, provider, provenance)}/>
                    ))
                )}

            </div>
        </div>
    );
};

const buildServiceRequestRows = (service: ServiceRequest, theSource?: string, provenance?: string): SummaryRowItems => {
    let rows: SummaryRowItems = [
        {
            isHeader: true,
            twoColumns: false,
            data1: displayConcept(service.code) ?? "No description",
            data2: '',
        }
    ];

    if (service.requester?.display) {
        const row: SummaryRowItem = {
            isHeader: false,
            twoColumns: false,
            data1: 'Requested by: ' + service.requester?.display,
            data2: '',
        }
        rows.push(row)
    }

    if (service.authoredOn) {
        const row: SummaryRowItem = {
            isHeader: false,
            twoColumns: false,
            data1: 'Ordered On: ' + displayDate(service.authoredOn),
            data2: '',
        }
        rows.push(row)
    }

    if (service.reasonCode && service.reasonCode[0]) {
        const row: SummaryRowItem = {
            isHeader: false,
            twoColumns: false,
            data1: 'Reason: ' + displayConcept(service.reasonCode[0]),
            data2: '',
        }
        rows.push(row)
    }

    if (service.reasonReference && service.reasonReference[0].display) {
        const row: SummaryRowItem = {
            isHeader: false,
            twoColumns: false,
            data1: 'Reason: ' + (service.reasonReference?.[0].display ?? ''),
            data2: '',
        }
        rows.push(row)
    }

    const notes: SummaryRowItems | undefined = service.note?.map((note, idx) => ({
        isHeader: false,
        twoColumns: false,
        data1: note.text ? 'Note ' + (idx + 1) + ': ' + note.text : '',
        data2: '',
    }));

    if (notes?.length) {
        rows = rows.concat(notes);
    }

    if (theSource || (provenance !== undefined)) {
        const source: SummaryRowItem = {
            isHeader: false,
            twoColumns: false,
            data1: 'Source: ' + (provenance !== undefined ? provenance : theSource),
            data2: '',
        };
        rows.push(source);
    }

    return rows;
};

const buildEncounterRows = (encounter: Encounter, theSource?: string, provenance?: string): SummaryRowItems => {
    let rows: SummaryRowItems = [
        {
            isHeader: true,
            twoColumns: false,
            data1: displayConcept(encounter?.type && encounter.type[0] ? encounter.type[0] : undefined) ?? '',
            data2: ''
        }
    ];

    rows.push({
        isHeader: false,
        twoColumns: true,
        data1: encounter.status,
        data2: displayPeriod(encounter.period) ?? '',
    })

    let reason: string | undefined = undefined;
    if (encounter.reasonCode && encounter.reasonCode[0]) {
        reason = displayConcept(encounter.reasonCode[0])
    } else if (encounter.reasonReference && encounter.reasonReference[0].display) {
        reason = encounter.reasonReference[0].display
    }

    rows.push({
        isHeader: false,
        twoColumns: true,
        data1: displayConcept(encounter.serviceType) ?? '',
        data2: reason ?? ''
    })

    rows.push({
        isHeader: false,
        twoColumns: false,
        data1: displayParticipant(encounter) ?? '',
        data2: ''
    })

    if (theSource || (provenance !== undefined)) {
        rows.push({
            isHeader: false,
            twoColumns: false,
            data1: 'Source: ' + (provenance !== undefined ? provenance : theSource),
            data2: '',
        });
    }

    return rows;
};
