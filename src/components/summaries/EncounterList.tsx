import '../../Home.css';
import React, {FC, useState, useEffect} from 'react';
import {
    FHIRData,
    displayConcept,
    displayTransmitter,
    displayPeriod, displayParticipant
} from '../../data-services/models/fhirResources';
import {Encounter} from '../../data-services/fhir-types/fhir-r4';
import {Summary, SummaryRowItems} from './Summary';
import {SortModal} from '../sort-modal/sortModal';
import {SortOnlyModal} from '../sort-only-modal/sortOnlyModal';
import {DeterminateProgress} from "../determinate-progress/DeterminateProgress";
import {CircularProgress} from "@mui/material";

interface EncounterListProps {
    sharingData: boolean;
    fhirDataCollection?: FHIRData[];
    progressTitle: string;
    progressValue: number;
    progressMessage: string;
}

export const EncounterList: FC<EncounterListProps> = ({sharingData, fhirDataCollection, 
                                                          progressTitle, progressValue, progressMessage}) => {
    process.env.REACT_APP_DEBUG_LOG === "true" && console.log("EncounterList component RENDERED!");

    const [showModal, setShowModal] = useState<boolean>(false);
    const [sortOption, setSortOption] = useState<string>('');
    const [filterOption, setFilterOption] = useState<string[]>([]);
    const [sortedAndFilteredEncounters, setSortedAndFilteredEncounters] = useState<{
        encounter: Encounter,
        provider: string,
        provenance?: string
    }[]>([]);
    const [filteringOptions, setFilteringOptions] = useState<{ value: string; label: string }[]>([]);

    useEffect(() => {
        applySortingAndFiltering();
    }, [fhirDataCollection, sortOption, filterOption]);

    useEffect(() => {
        generateFilteringOptions();
    }, [fhirDataCollection]);

    const closeModal = () => {
        setShowModal(false);
    };

    const handleSortFilterSubmit = (sortOption: string, filterOption?: string[]) => {
        setSortOption(sortOption);
        if (filterOption) {
            setFilterOption(filterOption);
        }
        setShowModal(false);
    };

    const generateFilteringOptions = () => {
        if (!fhirDataCollection || fhirDataCollection.length === 0) {
            setFilteringOptions([]);
            return;
        }

        const uniqueServerNames = Array.from(new Set(fhirDataCollection.map(data => data.serverName)));
        const options = uniqueServerNames.map(value => ({
            value: value || '',
            label: value || '',
        }));

        setFilteringOptions(options);
    };

    const sortingOptions = [
        // {value: 'alphabetical-az', label: 'Alphabetical: A-Z'},
        // {value: 'alphabetical-za', label: 'Alphabetical: Z-A'},
        {value: 'newest', label: 'Date Created: Newest'},
        {value: 'oldest', label: 'Date Created: Oldest'},
    ];

    const applySortingAndFiltering = () => {
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
        if (filterOption.length > 0) {
            combinedEncounters = combinedEncounters.filter(({provider}) => filterOption.includes(provider));
        }

        // Apply sorting
        switch (sortOption) {
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
                    <a className="text-right" onClick={() => setShowModal(true)}>
                        SORT
                    </a>
                ) : (
                    <a className="text-right" onClick={() => setShowModal(true)}>
                        SORT/FILTER
                    </a>
                )}

                {showModal && (
                    fhirDataCollection && fhirDataCollection.length === 1 ? (
                        <SortOnlyModal
                            showModal={showModal}
                            closeModal={closeModal}
                            onSubmit={handleSortFilterSubmit}
                            sortingOptions={sortingOptions}
                        />
                    ) : (
                        <SortModal
                            showModal={showModal}
                            closeModal={closeModal}
                            onSubmit={handleSortFilterSubmit}
                            sortingOptions={sortingOptions}
                            filteringOptions={filteringOptions}
                        />
                    )
                )}

                {sortedAndFilteredEncounters.length === 0 ? (
                    <p>No records found.</p>
                ) : (
                    sortedAndFilteredEncounters.map(({encounter, provider, provenance}, index) => (
                        <Summary key={index} id={index} rows={buildRows(encounter, provider, provenance)}/>
                    ))
                )}
            </div>
        </div>
    );
};

const buildRows = (encounter: Encounter, theSource?: string, provenance?: string): SummaryRowItems => {
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
