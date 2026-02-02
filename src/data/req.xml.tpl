<?xml version="1.0" encoding="utf-8" ?> 
<ns:SignRequest xmlns:ns="urn://mpkey.gosuslugi.ru/sign_document_ukep/1.0.0">
	<!--ns:OID>1000550738</ns:OID-->
	<ns:Snils>{snils}</ns:Snils>     
	<ns:Document>
		<ns:DocumentId>{documentId}</ns:DocumentId>
		<ns:MimeType>application/xml</ns:MimeType>
		<ns:Description>{description}</ns:Description>
		<ns:Backlink>https://lk.gosuslugi.ru/notifications</ns:Backlink>
		<ns:SignExpiration>{signExpiration}</ns:SignExpiration> 
		<ns:Attribute>
			<ns:AttributeName>mnemonics</ns:AttributeName>
			<ns:AttributeValue>GOSKEY_MNEMONIC</ns:AttributeValue>
		</ns:Attribute>
		<ns:Attribute>
			<ns:AttributeName>serviceName</ns:AttributeName>
			<ns:AttributeValue>Отправка документов на подпись в «Госключ </ns:AttributeValue>
		</ns:Attribute>
		<ns:Attribute>
			<ns:AttributeName>orgName</ns:AttributeName>
			<ns:AttributeValue>Название организации или ИС, которая отправляет документ на подпись</ns:AttributeValue>
		</ns:Attribute>
	</ns:Document>
</ns:SignRequest>