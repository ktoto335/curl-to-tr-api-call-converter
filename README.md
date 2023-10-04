JavaScript program to turn curl into a testRigor API call

Sample input:

curl -d '{"key1":"value1", "key2":"value2"}' -H "Content-Type: application/json" -X POST http://localhost:3000/data

Sample output:

call api POST "http://localhost:3000/data" with header "Content-Type:application/json" and body text starting from the next line and ending with [END]
{
	"key1": "value1",
	"key2": "value2"
}
[END]
