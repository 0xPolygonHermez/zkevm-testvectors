start_date="$(date +%T) $(date +%d/%m/%y)"
echo -e "start: $start_date" > times-eth-run-paralel.txt
# pass tests
npm run test:gen
gen_date="$(date +%T) $(date +%d/%m/%y)"
echo -e "end gen: $gen_date" >> times-eth-run-paralel.txt
npm run test:start:parallel
npm run test:start:parallel30M
end_date="$(date +%T) $(date +%d/%m/%y)"
echo -e "end run: $end_date" >> times-eth-run-paralel.txt