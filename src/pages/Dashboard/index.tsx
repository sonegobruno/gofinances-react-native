import React, { useCallback,useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useTheme } from '@react-navigation/native';
import { ActivityIndicator } from 'react-native'
import { HighlightCard } from '../../components/HighlightCard';
import { TransactionCard, TransactionCardData } from '../../components/TransactionCard';
import { currencyFormat } from '../../utils/currencyFormat';
import { dateFormat } from '../../utils/dateFormat';

import { 
    Container,
    Header,
    UserWrapper,
    UserInfo,
    Photo,
    User,
    UserGreeting,
    UserName,
    Icon,
    HighlightCards,
    Transactions,
    Title,
    TransactionList,
    LogoutButton,
    LoadContainer
} from './styles';

export interface DataListProps extends TransactionCardData {
    id: string;
}

interface HighLightProps {
    amount: string;
    lastTransaction: string;
}

interface HighLightData {
    entries: HighLightProps;
    expensive: HighLightProps;
    total: HighLightProps;
}

const dataKey = '@gofinances:transactions';

export function Dashboard() {
    const theme = useTheme();
    const [ transactions, setTransactions ] = useState<DataListProps[]>([]);
    const [ isLoading, setIsLoading ] = useState(true);
    const [ highLightData, setHighLightData ] = useState<HighLightData>({} as HighLightData);


    function getLastTransactionDate(collection: DataListProps[], type: 'positive' | 'negative') {
        const lastTransaction = new Date(Math.max.apply(Math, collection
            .filter((item) => item.type === type)
            .map((item) => new Date(item.date).getTime())
        ));

        return `${lastTransaction.getDate()} de ${lastTransaction.toLocaleString('pt-BR', { month: 'long' })}`;
    }
    
    async function loadData() {
        const response = await AsyncStorage.getItem(dataKey);
        const data = !!response ? JSON.parse(response) : [];

        let entriesTotal = 0;
        let expensiveTotal = 0;
        
        const transactionsFormated: DataListProps[] = data.map((item: DataListProps) => {

            if(item.type === 'positive') {
                entriesTotal += Number(item.amount);
            } else {
                expensiveTotal += Number(item.amount);
            }

            return {
                  ...item,
                amount: currencyFormat(item.amount),
                date: dateFormat(item.date)
                }
            
        });

        
        const total = entriesTotal - expensiveTotal;

        const lastTransactionEntries = getLastTransactionDate(data, 'positive');
        const lastTransactionExpensive = getLastTransactionDate(data, 'negative');
        const totalInterval = `01 a ${lastTransactionExpensive}`;


        setHighLightData({
            entries: {
                amount: currencyFormat(String(entriesTotal)),
                lastTransaction: `Última entrada dia ${lastTransactionEntries}`
            },
            expensive: {
                amount: currencyFormat(String(expensiveTotal)),
                lastTransaction: `Última saída dia ${lastTransactionExpensive}`
            },
            total: {
                amount: currencyFormat(String(total)),
                lastTransaction: totalInterval
            }
        });

        setTransactions(transactionsFormated);
        setIsLoading(false);
    }

    useEffect(() => {
        loadData();
    },[])

    useFocusEffect(useCallback(() => {
        loadData();
    },[]))

    return (
        <Container>

            { isLoading ? 
                <LoadContainer>
                    <ActivityIndicator color={theme.colors.primary} size="large"/>
                </LoadContainer> :
                <>
                    <Header>
                    <UserWrapper>
                        <UserInfo>
                            <Photo source={{ uri: "https://avatars.githubusercontent.com/u/33105540?v=4"}} />
                            <User>
                                <UserGreeting>Olá,</UserGreeting>
                                <UserName>Bruno</UserName>
                            </User>
                        </UserInfo>

                        <LogoutButton onPress={() => {}}>
                            <Icon name="power"/>
                        </LogoutButton>
                    </UserWrapper>
                    </Header>
                    <HighlightCards>
                        <HighlightCard type="up" title="Entradas" amount={highLightData.entries.amount} lastTransaction={highLightData.entries.lastTransaction}/>
                        <HighlightCard type="down" title="Saídas" amount={highLightData.expensive.amount} lastTransaction={highLightData.expensive.lastTransaction}/>
                        <HighlightCard type="total" title="Total" amount={highLightData.total.amount} lastTransaction={highLightData.total.lastTransaction}/>
                    </HighlightCards>
                    
                    <Transactions>
                        <Title>Listagem</Title>

                        <TransactionList 
                            data={transactions}
                            keyExtractor={item => item.id}
                            renderItem={({item}) => <TransactionCard data={item} />}
                        />
                    </Transactions>
                </>
            }
            
        </Container>
    )
}